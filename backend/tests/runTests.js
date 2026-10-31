const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn, spawnSync, execSync } = require('child_process');
const mongoose = require('mongoose');

const results = [];

function recordResult(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} [${passed ? 'PASS' : 'FAIL'}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

function evaluateAndSetExitCode() {
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log('================================================================');
  console.log(` RESUMEN: ${passedCount} / ${results.length} PRUEBAS EXITOSAS`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exitCode = 1;
    console.error(`❌ La suite finalizó con ${failedCount} prueba(s) fallida(s).`);
  }
}

// MODO DE VERIFICACIÓN CONTROLADA DEL RUNNER ANTE FALLAS REALES
if (process.argv.includes('--verify-failure-exit-code')) {
  console.log('[VERIFICACIÓN DE RUNNER] Ejecutando evaluación real de fallos en el runner...');
  recordResult('Prueba de verificación positiva', true, 'Pasa OK');
  recordResult('Prueba de verificación negativa controlada', false, 'Falla intencional para evaluar el runner');
  evaluateAndSetExitCode();
  return;
}

// Variables de entorno de prueba
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jwt_test_secret_key_utn_enjoy_2026';
process.env.JWT_EXPIRES_IN = '2h';
const TEST_PORT = 5055;
const MONGO_PORT = 27019;

/**
 * Función de seguridad para validar que el nombre de la base de datos sea estrictamente de pruebas.
 * Previene cualquier operación destructiva accidental sobre bases de producción o ajenas.
 */
function isSafeTestDatabase(dbName) {
  if (!dbName || typeof dbName !== 'string') return false;
  const name = dbName.toLowerCase().trim();
  // Patrón estricto: debe ser 'enjoy_test_db', 'enjoy_test' o terminar exactamente en '_test' o '_test_db'
  const isStrictlyTest = name === 'enjoy_test_db' || name === 'enjoy_test' || /^[a-z0-9_-]+(_test|_test_db)$/.test(name);
  const isForbidden = name === 'enjoy_psicopedagogia' || name.startsWith('prod') || name.startsWith('production');
  return isStrictlyTest && !isForbidden;
}

function extractDbNameFromUri(uri) {
  try {
    const sanitized = uri.replace('mongodb://', 'http://').replace('mongodb+srv://', 'http://');
    const parsed = new URL(sanitized);
    const pathname = parsed.pathname.replace(/^\//, '');
    return pathname.split('?')[0];
  } catch {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : '';
  }
}

const targetMongoUri = process.env.TEST_MONGO_URI || `mongodb://127.0.0.1:${MONGO_PORT}/enjoy_test_db`;
const targetDbName = extractDbNameFromUri(targetMongoUri);

if (!isSafeTestDatabase(targetDbName)) {
  console.error(`\n❌ ERROR CRÍTICO DE SEGURIDAD: La base de datos objetivo '${targetDbName}' no cumple con el patrón estricto de pruebas.`);
  console.error('Los tests solo pueden ejecutarse sobre bases explícitas como "enjoy_test_db" o que terminen estrictamente en "_test" o "_test_db".');
  process.exit(1);
}

process.env.MONGO_URI = targetMongoUri;
const tempDbPath = path.join(__dirname, '.temp_mongo_test');

/**
 * Resuelve de forma portable la ruta del binario ejecutable de MongoDB (mongod).
 */
function resolveMongodPath() {
  if (process.env.MONGOD_PATH && fs.existsSync(process.env.MONGOD_PATH)) {
    return process.env.MONGOD_PATH;
  }

  try {
    const cmd = process.platform === 'win32' ? 'where mongod' : 'which mongod';
    const output = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
    const firstMatch = output.split(/\r?\n/)[0].trim();
    if (firstMatch && fs.existsSync(firstMatch)) {
      return firstMatch;
    }
  } catch {
    // No disponible directamente en PATH
  }

  if (process.platform === 'win32') {
    const baseProgramFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const serverDir = path.join(baseProgramFiles, 'MongoDB', 'Server');
    if (fs.existsSync(serverDir)) {
      try {
        const versions = fs.readdirSync(serverDir).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
        for (const v of versions) {
          const candidate = path.join(serverDir, v, 'bin', 'mongod.exe');
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      } catch {
        // Ignorar errores de acceso
      }
    }
  }

  if (process.platform !== 'win32') {
    const unixCandidates = [
      '/usr/bin/mongod',
      '/usr/local/bin/mongod',
      '/opt/homebrew/bin/mongod',
    ];
    for (const candidate of unixCandidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

let mongodProc = null;
let serverInstance = null;

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function waitForPort(port, host = '127.0.0.1', timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const client = net.createConnection({ port, host }, () => {
          client.end();
          resolve();
        });
        client.on('error', (err) => reject(err));
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`Timeout esperando que el puerto ${port} esté disponible`);
}

async function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const client = net.createConnection({ port, host }, () => {
      client.end();
      resolve(true);
    });
    client.on('error', () => resolve(false));
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log(' INICIANDO SUITE DE PRUEBAS FUNCIONALES DEL TP BACKEND (UTN)');
  console.log('================================================================\n');

  try {
    // 1. Iniciar o conectar a MongoDB de forma portable
    const detectedMongod = resolveMongodPath();

    if (detectedMongod) {
      console.log(`[1/4] Binario mongod detectado en: ${detectedMongod}`);
      console.log(`      Iniciando instancia aislada de MongoDB en puerto ${MONGO_PORT}...`);
      if (!fs.existsSync(tempDbPath)) {
        fs.mkdirSync(tempDbPath, { recursive: true });
      }
      mongodProc = spawn(detectedMongod, [
        '--dbpath',
        tempDbPath,
        '--port',
        String(MONGO_PORT),
        '--bind_ip',
        '127.0.0.1',
      ]);

      await waitForPort(MONGO_PORT, '127.0.0.1', 12000);
      console.log('  -> MongoDB iniciado correctamente en sandbox de prueba.\n');
    } else {
      const standardPortActive = await isPortOpen(27017);
      if (standardPortActive) {
        process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/enjoy_test_db';
        console.log('[1/4] mongod no encontrado localmente. Conectando a servicio existente en puerto 27017...\n');
      } else {
        throw new Error(
          'No se encontró el ejecutable de MongoDB ni una instancia activa.\n' +
          'Configure la variable de entorno MONGOD_PATH con la ruta completa a mongod, ' +
          'agréguelo al PATH del sistema o inicie el servicio de MongoDB en el puerto 27017.'
        );
      }
    }

    // 2. Conectar Mongoose e Iniciar Express App
    console.log('[2/4] Conectando Mongoose e inicializando Express...');
    await mongoose.connect(process.env.MONGO_URI);
    const app = require('../app');

    serverInstance = app.listen(TEST_PORT);
    console.log(`  -> Servidor de pruebas escuchando en http://127.0.0.1:${TEST_PORT}\n`);

    console.log('================================================================');
    console.log(' EJECUTANDO PRUEBAS DE VERIFICACIÓN FUNCIONAL');
    console.log('================================================================');

    const baseOpt = (pathname, method = 'GET', headers = {}) => {
      return {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };
    };

    // PRUEBA 1: Conexión con MongoDB
    recordResult('1. Conexión con MongoDB', mongoose.connection.readyState === 1, 'Mongoose conectado a BD de prueba');

    // PRUEBA 2: Inicio del servidor y endpoint raíz
    const resRoot = await request(baseOpt('/'));
    recordResult('2. Inicio del servidor y Endpoint Raíz', resRoot.status === 200 && resRoot.data.status === 'online', 'HTTP 200');

    // PRUEBA 3: Registro de usuarios - Forzado de rol paciente
    const userPayload = {
      nombre: 'Prueba Registro',
      email: 'test.paciente@example.com',
      password: 'Password123!',
      telNumber: '+543364001122',
      rol: 'admin', // Intento de inyectar rol admin
    };
    const resReg = await request(baseOpt('/api/usuarios/register', 'POST'), userPayload);
    const registeredUser = resReg.data?.data?.user;
    const rolSeguro = registeredUser?.rol === 'paciente';
    recordResult('3. Registro de usuarios seguro', resReg.status === 201 && rolSeguro, 'Fuerza rol paciente e ignora rol enviado');

    // PRUEBA 4: Hash de contraseñas con bcrypt
    const User = require('../src/models/userModel');
    const Turno = require('../src/models/turnoModel');
    const userInDb = await User.findOne({ email: 'test.paciente@example.com' }).select('+password');
    const hasBcryptHash = userInDb && userInDb.password && (userInDb.password.startsWith('$2a$') || userInDb.password.startsWith('$2b$'));
    recordResult('4. Hash de contraseñas con bcrypt', hasBcryptHash, 'La contraseña está hasheada con salting en BD');

    // PRUEBA 5: Login y generación de JWT
    const resLogin = await request(baseOpt('/api/usuarios/login', 'POST'), {
      email: 'test.paciente@example.com',
      password: 'Password123!',
    });
    const loginToken = resLogin.data?.data?.token;
    recordResult('5. Login y generación JWT', resLogin.status === 200 && Boolean(loginToken), 'Token JWT emitido exitosamente');

    // PRUEBA 6: Rechazo de tokens inválidos o corruptos
    const resInvalidToken = await request(baseOpt('/api/usuarios', 'GET', { Authorization: 'Bearer token_invalido_corrupto' }));
    recordResult('6. Rechazo de tokens inválidos', resInvalidToken.status === 403, 'Responde HTTP 403 Forbidden');

    // PRUEBA 7: Protección de rutas sensibles (sin token)
    const resNoToken = await request(baseOpt('/api/servicios', 'POST'), {
      nombre: 'Servicio Inseguro',
      descripcion: 'Prueba',
      duracionMinutos: 40,
      precio: 5000,
    });
    recordResult('7. Protección de rutas sensibles sin token', resNoToken.status === 401, 'POST /api/servicios sin token responde HTTP 401');

    // Crear un usuario Administrador directo para operaciones que requieren admin
    await User.create({
      nombre: 'Admin Test',
      email: 'admin.test@example.com',
      password: 'AdminPassword123!',
      rol: 'admin',
    });
    const resLoginAdmin = await request(baseOpt('/api/usuarios/login', 'POST'), {
      email: 'admin.test@example.com',
      password: 'AdminPassword123!',
    });
    const adminToken = resLoginAdmin.data?.data?.token;

    // PRUEBA 8: CRUD completo de Categorías (Admin)
    const resCatPost = await request(baseOpt('/api/categorias', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      nombre: 'Materiales Terapéuticos',
      descripcion: 'Juegos y herramientas clínicas',
    });
    const catId = resCatPost.data?.data?._id;
    const resCatGet = await request(baseOpt('/api/categorias'));
    const resCatPut = await request(baseOpt(`/api/categorias/${catId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      descripcion: 'Descripción actualizada',
    });
    const resCatDelete = await request(baseOpt(`/api/categorias/${catId}`, 'DELETE', { Authorization: `Bearer ${adminToken}` }));
    recordResult('8. CRUD completo de Categorías (Admin)', resCatPost.status === 201 && resCatGet.status === 200 && resCatPut.status === 200 && resCatDelete.status === 200, 'POST 201, GET 200, PUT 200, DELETE 200');

    // Recreamos categoría para vincular producto
    const catFinal = await request(baseOpt('/api/categorias', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      nombre: 'Estimulación Lúdica',
      descripcion: 'Juegos didácticos',
    });
    const catRefId = catFinal.data?.data?._id;

    // PRUEBA 9: CRUD completo de Productos (Admin)
    const resProdPost = await request(baseOpt('/api/productos', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      nombre: 'Juego de Memoria Visual',
      descripcion: 'Tarjetas didácticas',
      precio: 4500,
      stock: 12,
      categoria: catRefId,
    });
    const prodId = resProdPost.data?.data?._id;
    const resProdGet = await request(baseOpt('/api/productos'));
    const resProdPut = await request(baseOpt(`/api/productos/${prodId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      precio: 4900,
    });
    const resProdDel = await request(baseOpt(`/api/productos/${prodId}`, 'DELETE', { Authorization: `Bearer ${adminToken}` }));
    recordResult('9. CRUD completo de Productos (Admin)', resProdPost.status === 201 && resProdGet.status === 200 && resProdPut.status === 200 && resProdDel.status === 200, 'POST 201, GET 200, PUT 200, DELETE 200');

    // PRUEBA 10: CRUD completo de Servicios (Admin)
    const resServPost = await request(baseOpt('/api/servicios', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      nombre: 'Estimulación del Razonamiento',
      descripcion: 'Sesión psicopedagógica personalizada',
      duracionMinutos: 45,
      precio: 8500,
      activo: true,
    });
    const servId = resServPost.data?.data?._id;
    const resServGet = await request(baseOpt('/api/servicios'));
    const resServPut = await request(baseOpt(`/api/servicios/${servId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      precio: 9200,
    });
    const resServDel = await request(baseOpt(`/api/servicios/${servId}`, 'DELETE', { Authorization: `Bearer ${adminToken}` }));
    recordResult('10. CRUD completo de Servicios (Admin)', resServPost.status === 201 && resServGet.status === 200 && resServPut.status === 200 && resServDel.status === 200, 'POST 201, GET 200, PUT 200, DELETE 200');

    // Recreamos servicio para asociar turnos
    const servActivo = await request(baseOpt('/api/servicios', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      nombre: 'Atención Psicopedagógica Integral',
      descripcion: 'Admisión y evaluación',
      duracionMinutos: 50,
      precio: 8500,
      activo: true,
    });
    const servRefId = servActivo.data?.data?._id;

    // PRUEBA 11: CRUD completo de Turnos (Admin) y Formulario Web Público
    const resTurnoPost = await request(baseOpt('/api/turnos', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      pacienteId: registeredUser._id,
      servicioId: servRefId,
      fechaHora: new Date('2026-11-20T15:00:00Z'),
      motivoConsulta: 'Dificultades en lectoescritura',
      comentarios: 'Derivación escolar',
    });
    const turnoId = resTurnoPost.data?.data?._id;
    const resTurnoGet = await request(baseOpt('/api/turnos', 'GET', { Authorization: `Bearer ${adminToken}` }));
    const resTurnoPut = await request(baseOpt(`/api/turnos/${turnoId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      estado: 'confirmado',
    });
    const resTurnoDel = await request(baseOpt(`/api/turnos/${turnoId}`, 'DELETE', { Authorization: `Bearer ${adminToken}` }));
    const resTurnoSolicitar = await request(baseOpt('/api/turnos/solicitar', 'POST'), {
      nombre: 'Paciente Web',
      email: 'paciente.web@example.com',
      telNumber: '+543364998877',
      motivoConsulta: 'Consulta web inicial',
    });
    recordResult('11. CRUD de Turnos & Formulario Web', resTurnoPost.status === 201 && resTurnoGet.status === 200 && resTurnoPut.status === 200 && resTurnoDel.status === 200 && resTurnoSolicitar.status === 201, 'CRUD completo por Admin y endpoint /solicitar funcionando');

    // Creamos un turno activo para pruebas de relaciones y actualización
    const resTurnoParaPruebas = await request(baseOpt('/api/turnos', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      pacienteId: registeredUser._id,
      servicioId: servRefId,
      fechaHora: new Date('2026-11-25T17:00:00Z'),
      motivoConsulta: 'Verificación populate y validaciones',
    });
    const turnoActivoId = resTurnoParaPruebas.data?.data?._id;

    // PRUEBA 12: Funcionamiento de populate
    const turnoPopulado = resTurnoParaPruebas.data?.data;
    const populateFunciona = turnoPopulado?.pacienteId?.nombre === 'Prueba Registro' && turnoPopulado?.servicioId?.nombre === 'Atención Psicopedagógica Integral';
    recordResult('12. Funcionamiento de populate', Boolean(populateFunciona), 'pacienteId y servicioId resueltos como objetos completos');

    // PRUEBA 13: Validación de IDs incorrectos
    const resInvalidId = await request(baseOpt('/api/servicios/id-invalido-123'));
    recordResult('13. Validación de IDs incorrectos', resInvalidId.status === 400 && resInvalidId.data.success === false, 'Responde HTTP 400 Bad Request');

    // PRUEBA 14: Manejo de errores y códigos HTTP
    const resNotFound = await request(baseOpt('/api/servicios/60d5ed291f3c882b548b9999'));
    recordResult('14. Manejo de errores y códigos HTTP', resNotFound.status === 404 && resNotFound.data.success === false, 'HTTP 404 para ID inexistente');

    // PRUEBA 15: CORS habilitado
    const resCors = await request(baseOpt('/api/servicios'));
    const corsHeader = resCors.headers['access-control-allow-origin'];
    recordResult('15. Middleware CORS', corsHeader === '*' || Boolean(corsHeader), `Header CORS presente: ${corsHeader || 'OK'}`);

    // PRUEBA 16: Comprobación del comportamiento del runner runTests.js ante una falla real
    const selfTestProc = spawnSync(
      process.execPath,
      [path.join(__dirname, 'runTests.js'), '--verify-failure-exit-code'],
      { encoding: 'utf8' }
    );
    const combinedOutput = (selfTestProc.stdout || '') + (selfTestProc.stderr || '');
    const runnerExitCodeVerified = selfTestProc.status === 1 &&
      combinedOutput.includes('Falla intencional para evaluar el runner') &&
      combinedOutput.includes('❌ La suite finalizó con 1 prueba(s) fallida(s).');

    recordResult(
      '16. Salida de runTests.js con exitCode = 1 ante falla real',
      runnerExitCodeVerified,
      'El runner evalúa results y finaliza con exitCode = 1 ante pruebas fallidas'
    );

    // PRUEBA 17: Rechazo de tokens expirados
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { id: registeredUser._id, rol: registeredUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );
    const resExpired = await request(baseOpt('/api/servicios', 'POST', { Authorization: `Bearer ${expiredToken}` }), {
      nombre: 'Servicio con token expirado',
      descripcion: 'Intento de creación con token vencido',
      duracionMinutos: 30,
      precio: 1000,
    });
    recordResult('17. Rechazo de tokens expirados', resExpired.status === 401 && resExpired.data?.message?.toLowerCase().includes('expirado'), 'HTTP 401 y mensaje de expiración de sesión');

    // PRUEBA 18: Validación de referencias inexistentes en turnoService.update
    const nonExistentPacienteId = new mongoose.Types.ObjectId().toString();
    const resTurnoBadPaciente = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      pacienteId: nonExistentPacienteId,
    });

    const nonExistentServicioId = new mongoose.Types.ObjectId().toString();
    const resTurnoBadServicio = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      servicioId: nonExistentServicioId,
    });

    const resTurnoInvalidPaciente = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      pacienteId: 'id-paciente-mal-formado',
    });

    const turnosRefValidationPassed = resTurnoBadPaciente.status === 404 &&
                                      resTurnoBadServicio.status === 404 &&
                                      resTurnoInvalidPaciente.status === 400;
    recordResult('18. Validación de referencias en turnoService.update', turnosRefValidationPassed, 'HTTP 404 para referencias inexistentes y HTTP 400 para ID mal formado');

    // PRUEBA 19: Formulario de contacto no genera cuentas con contraseñas predecibles ni fechas inventadas
    const contactEmail = 'paciente.contacto.seguro@example.com';
    const resContactForm = await request(baseOpt('/api/turnos/solicitar', 'POST'), {
      nombre: 'Paciente Contacto Seguro',
      email: contactEmail,
      telNumber: '+543364991122',
      motivoConsulta: 'Evaluación inicial segura sin clave predecible',
    });

    const resLoginPredictable = await request(baseOpt('/api/usuarios/login', 'POST'), {
      email: contactEmail,
      password: 'TempPassword123!',
    });

    const contactUserInDb = await User.findOne({ email: contactEmail }).select('+password');
    const createdTurnoData = resContactForm.data?.data;
    const contactFormSecure = resContactForm.status === 201 &&
                              resLoginPredictable.status === 401 &&
                              Boolean(contactUserInDb) &&
                              Boolean(contactUserInDb.password) &&
                              contactUserInDb.password !== 'TempPassword123!' &&
                              createdTurnoData?.fechaHora === null &&
                              createdTurnoData?.estado === 'pendiente';

    recordResult('19. Formulario de contacto con contraseña segura y sin fecha inventada', contactFormSecure, 'Turno en estado pendiente (fechaHora: null) y login con "TempPassword123!" rechazado con 401');

    // PRUEBA 20: Restricción de administración a rol paciente (servicios, productos, categorías)
    const resPacientePostServ = await request(baseOpt('/api/servicios', 'POST', { Authorization: `Bearer ${loginToken}` }), {
      nombre: 'Servicio Paciente Ilegal',
      descripcion: 'No permitido',
      duracionMinutos: 40,
      precio: 5000,
    });
    const resPacientePostProd = await request(baseOpt('/api/productos', 'POST', { Authorization: `Bearer ${loginToken}` }), {
      nombre: 'Producto Paciente Ilegal',
      descripcion: 'No permitido',
      precio: 1000,
      stock: 5,
      categoria: catRefId,
    });
    const resPacientePostCat = await request(baseOpt('/api/categorias', 'POST', { Authorization: `Bearer ${loginToken}` }), {
      nombre: 'Categoria Paciente Ilegal',
      descripcion: 'No permitido',
    });
    const adminOpsForbiddenForPatient = resPacientePostServ.status === 403 &&
                                        resPacientePostProd.status === 403 &&
                                        resPacientePostCat.status === 403;
    recordResult('20. Restricción de administración a pacientes (403)', adminOpsForbiddenForPatient, 'POST /servicios, /productos y /categorias rechazados con HTTP 403');

    // PRUEBA 21: Aislamiento de turnos por paciente (no puede ver turnos de otros)
    const resOtroPaciente = await request(baseOpt('/api/usuarios/register', 'POST'), {
      nombre: 'Segundo Paciente',
      email: 'segundo.paciente@example.com',
      password: 'Password123!',
      telNumber: '+543364887766',
    });
    const otroPacienteToken = resOtroPaciente.data?.data?.token;

    // Paciente B intenta consultar el turno de Paciente A
    const resGetTurnoAjeno = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'GET', { Authorization: `Bearer ${otroPacienteToken}` }));
    // Paciente B consulta la lista de turnos (solo debe devolver sus turnos, es decir, 0 en este momento)
    const resListTurnosPaciente2 = await request(baseOpt('/api/turnos', 'GET', { Authorization: `Bearer ${otroPacienteToken}` }));

    const turnoIsolationWorks = resGetTurnoAjeno.status === 403 &&
                                resListTurnosPaciente2.status === 200 &&
                                resListTurnosPaciente2.data?.data?.length === 0;

    recordResult('21. Aislamiento de turnos por paciente (403)', turnoIsolationWorks, 'GET /turnos/:id ajeno devuelve 403; GET /turnos aísla por paciente');

    // PRUEBA 22: Paciente no puede modificar ni eliminar turnos (administración exclusiva)
    // Paciente intenta PUT /api/turnos/:id (incluso el propio o ajeno)
    const resPacientePutTurno = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'PUT', { Authorization: `Bearer ${loginToken}` }), {
      estado: 'confirmado',
      fechaHora: new Date('2026-12-01T10:00:00Z'),
    });
    // Paciente intenta DELETE /api/turnos/:id
    const resPacienteDelTurno = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'DELETE', { Authorization: `Bearer ${loginToken}` }));

    const patientCannotModifyOrDelete = resPacientePutTurno.status === 403 && resPacienteDelTurno.status === 403;
    recordResult('22. Paciente no puede modificar ni eliminar turnos (403)', patientCannotModifyOrDelete, 'PUT y DELETE en /api/turnos/:id devuelven HTTP 403 para pacientes');

    // PRUEBA 23: Operación específica y limitada de cancelación de turno propio
    // Paciente A cancela su propio turno mediante PATCH /api/turnos/:id/cancelar
    const resPacienteCancelaPropio = await request(baseOpt(`/api/turnos/${turnoActivoId}/cancelar`, 'PATCH', { Authorization: `Bearer ${loginToken}` }));
    // Paciente B intenta cancelar el turno de Paciente A mediante PATCH /api/turnos/:id/cancelar
    const resPacienteBCancelaAjeno = await request(baseOpt(`/api/turnos/${turnoActivoId}/cancelar`, 'PATCH', { Authorization: `Bearer ${otroPacienteToken}` }));

    const cancelOwnTurnoWorks = resPacienteCancelaPropio.status === 200 &&
                                resPacienteCancelaPropio.data?.data?.estado === 'cancelado' &&
                                resPacienteBCancelaAjeno.status === 403;
    recordResult('23. Operación específica de cancelación de turno', cancelOwnTurnoWorks, 'PATCH /turnos/:id/cancelar permite cancelar turno propio pero rechaza ajeno con 403');

    // PRUEBA 24: Rechazo de operadores de MongoDB y validación estricta en turnoService.update
    const resMongoOperatorInject = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      $set: { estado: 'confirmado' },
    });
    const resInvalidState = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'PUT', { Authorization: `Bearer ${adminToken}` }), {
      estado: 'estado_invalido_hacker',
    });
    const dataValidationPassed = resMongoOperatorInject.status === 400 && resInvalidState.status === 400;
    recordResult('24. Validación de datos y filtro de operadores Mongo (400)', dataValidationPassed, 'Rechaza operadores $set/$unset y estados no válidos con HTTP 400');

    // PRUEBA 25: Protección estricta de base de datos en tests
    const prodRejected = !isSafeTestDatabase('enjoy_psicopedagogia') &&
                         !isSafeTestDatabase('production') &&
                         !isSafeTestDatabase('my_db_external') &&
                         !isSafeTestDatabase('contest_db');
    const testAccepted = isSafeTestDatabase('enjoy_test_db') &&
                         isSafeTestDatabase('enjoy_test') &&
                         isSafeTestDatabase('app_test_db');
    recordResult('25. Protección de base de datos de tests', prodRejected && testAccepted, 'Filtro estricto rechaza bases de producción y externas no autorizadas');

    // PRUEBA 26: Reglas de negocio para cancelación de turnos (ya cancelados, pasados y confirmados)
    // 26a. Reintento de cancelación de turno ya cancelado -> HTTP 400
    const resRecancelar = await request(baseOpt(`/api/turnos/${turnoActivoId}/cancelar`, 'PATCH', { Authorization: `Bearer ${loginToken}` }));

    // 26b. Intento de cancelar turno realizado cuya fecha ya transcurrió -> HTTP 400
    const pastTurno = await Turno.create({
      pacienteId: registeredUser._id,
      servicioId: servRefId,
      fechaHora: new Date('2020-01-15T10:00:00Z'),
      estado: 'confirmado',
      motivoConsulta: 'Turno histórico realizado',
    });
    const resCancelPast = await request(baseOpt(`/api/turnos/${pastTurno._id}/cancelar`, 'PATCH', { Authorization: `Bearer ${adminToken}` }));

    // 26c. Intento del paciente de cancelar un turno confirmado en el futuro -> HTTP 400 (debe coordinarse con el consultorio)
    const futureConfirmedTurno = await Turno.create({
      pacienteId: registeredUser._id,
      servicioId: servRefId,
      fechaHora: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estado: 'confirmado',
      motivoConsulta: 'Sesión confirmada futura',
    });
    const resPatientCancelConfirmed = await request(baseOpt(`/api/turnos/${futureConfirmedTurno._id}/cancelar`, 'PATCH', { Authorization: `Bearer ${loginToken}` }));
    // Admin sí puede cancelar un turno confirmado futuro
    const resAdminCancelConfirmed = await request(baseOpt(`/api/turnos/${futureConfirmedTurno._id}/cancelar`, 'PATCH', { Authorization: `Bearer ${adminToken}` }));

    const cancellationBusinessRulesPassed = resRecancelar.status === 400 &&
                                            resCancelPast.status === 400 &&
                                            resCancelPast.data?.message?.includes('No es posible cancelar un turno cuya fecha y hora ya han transcurrido') &&
                                            resPatientCancelConfirmed.status === 400 &&
                                            resAdminCancelConfirmed.status === 200;
    recordResult('26. Reglas de negocio en cancelación de turnos (400)', cancellationBusinessRulesPassed, 'Rechaza cancelar turnos ya cancelados, pasados o confirmados por paciente; admin puede cancelar');

    // PRUEBA 27: Rechazo de roles desconocidos o inválidos en endpoints de turnos (403)
    const invalidRoleToken = jwt.sign(
      { id: registeredUser._id, rol: 'rol_fantasma_invalido' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resGetTurnosInvalidRole = await request(baseOpt('/api/turnos', 'GET', { Authorization: `Bearer ${invalidRoleToken}` }));
    const resGetByIdInvalidRole = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'GET', { Authorization: `Bearer ${invalidRoleToken}` }));
    const resCancelInvalidRole = await request(baseOpt(`/api/turnos/${turnoActivoId}/cancelar`, 'PATCH', { Authorization: `Bearer ${invalidRoleToken}` }));

    const invalidRoleRejected = resGetTurnosInvalidRole.status === 403 &&
                                resGetByIdInvalidRole.status === 403 &&
                                resCancelInvalidRole.status === 403;
    recordResult('27. Rechazo de roles desconocidos en turnos (403)', invalidRoleRejected, 'GET /turnos, GET /turnos/:id y PATCH /turnos/:id/cancelar rechazan roles no reconocidos con 403');

    // PRUEBA 28: Rechazo en turnoService cuando no se proporciona currentUser (403)
    const turnoService = require('../src/services/turnoService');
    let errGetAllNoUser;
    let errGetByIdNoUser;
    let errCreateNoUser;
    let errUpdateNoUser;
    let errCancelNoUser;
    let errDeleteNoUser;

    try {
      await turnoService.getAll({}, null);
    } catch (err) {
      errGetAllNoUser = err;
    }

    try {
      await turnoService.getById(turnoActivoId, null);
    } catch (err) {
      errGetByIdNoUser = err;
    }

    try {
      await turnoService.create(
        {
          pacienteId: registeredUser._id,
          servicioId: servRefId,
          fechaHora: new Date('2026-12-10T11:00:00Z'),
          motivoConsulta: 'Test sin usuario',
        },
        null
      );
    } catch (err) {
      errCreateNoUser = err;
    }

    try {
      await turnoService.update(turnoActivoId, { estado: 'confirmado' }, null);
    } catch (err) {
      errUpdateNoUser = err;
    }

    try {
      await turnoService.cancelar(turnoActivoId, null);
    } catch (err) {
      errCancelNoUser = err;
    }

    try {
      await turnoService.delete(turnoActivoId, null);
    } catch (err) {
      errDeleteNoUser = err;
    }

    const serviceNoUserRejected = errGetAllNoUser?.statusCode === 403 &&
                                  errGetByIdNoUser?.statusCode === 403 &&
                                  errCreateNoUser?.statusCode === 403 &&
                                  errUpdateNoUser?.statusCode === 403 &&
                                  errCancelNoUser?.statusCode === 403 &&
                                  errDeleteNoUser?.statusCode === 403;

    recordResult(
      '28. Rechazo en turnoService sin usuario autenticado (403)',
      Boolean(serviceNoUserRejected),
      'getAll, getById, create, update, cancelar y delete exigen currentUser y devuelven HTTP 403'
    );

    // PRUEBA 29: Rechazo de rol paciente sin identificador válido (403)
    const patientWithoutIdToken = jwt.sign(
      { rol: 'paciente' }, // Token firmado válido pero sin identificador de paciente
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 1. No puede listar turnos (GET /api/turnos) -> 403 (evita consulta sin filtro pacienteId)
    const resListNoId = await request(baseOpt('/api/turnos', 'GET', { Authorization: `Bearer ${patientWithoutIdToken}` }));

    // 2. No puede consultar turnos ajenos ni propios (GET /api/turnos/:id) -> 403
    const resGetNoId = await request(baseOpt(`/api/turnos/${turnoActivoId}`, 'GET', { Authorization: `Bearer ${patientWithoutIdToken}` }));

    // 3. No puede cancelar turnos (PATCH /api/turnos/:id/cancelar) -> 403
    const resCancelNoId = await request(baseOpt(`/api/turnos/${turnoActivoId}/cancelar`, 'PATCH', { Authorization: `Bearer ${patientWithoutIdToken}` }));

    // 4. Token con identificador mal formado -> 403
    const patientWithBadIdToken = jwt.sign(
      { rol: 'paciente', id: 'id_invalido_mal_formado' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resListBadId = await request(baseOpt('/api/turnos', 'GET', { Authorization: `Bearer ${patientWithBadIdToken}` }));

    const patientWithoutIdRejected = resListNoId.status === 403 &&
                                     resGetNoId.status === 403 &&
                                     resCancelNoId.status === 403 &&
                                     resListBadId.status === 403;

    recordResult(
      '29. Paciente sin identificador válido no puede operar turnos (403)',
      patientWithoutIdRejected,
      'GET /turnos, GET /turnos/:id y PATCH /turnos/:id/cancelar rechazan con 403 si falta o es inválido el id'
    );

    evaluateAndSetExitCode();
  } catch (error) {
    console.error('Error fatal durante la ejecución de las pruebas:', error);
    process.exitCode = 1;
  } finally {
    // Limpieza de procesos y base de datos con validación de seguridad estricta
    console.log('Limpiando entorno de pruebas...');
    try {
      if (mongoose.connection.readyState !== 0) {
        const currentDbName = mongoose.connection.name || mongoose.connection.db?.databaseName;
        // La limpieza destructiva dropDatabase() se limita EXCLUSIVAMENTE a la instancia aislada
        // iniciada por el propio runner (mongodProc !== null) y cuya base sea estrictamente de pruebas.
        if (mongodProc && isSafeTestDatabase(currentDbName)) {
          try {
            await mongoose.connection.dropDatabase();
            console.log(`  -> Base de datos aislada '${currentDbName}' limpiada con éxito.`);
          } catch (dropErr) {
            console.warn('  [Aviso] No se pudo limpiar la base de datos aislada:', dropErr.message);
          }
        } else if (!mongodProc) {
          console.log('  -> Instancia externa de MongoDB detectada: dropDatabase() omitido por seguridad.');
        }
        await mongoose.connection.close();
      }
      if (serverInstance) {
        serverInstance.close();
      }
      if (mongodProc) {
        mongodProc.kill();
      }
      setTimeout(() => {
        try {
          if (fs.existsSync(tempDbPath)) {
            fs.rmSync(tempDbPath, { recursive: true, force: true });
          }
        } catch {}
      }, 1000);
    } catch (cleanupErr) {
      console.warn('Advertencia en limpieza:', cleanupErr.message);
    }
  }
}

runTestSuite();
