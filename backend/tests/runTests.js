const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');
const mongoose = require('mongoose');

// Variables de entorno de prueba
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jwt_test_secret_key_utn_enjoy_2026';
process.env.JWT_EXPIRES_IN = '2h';
const TEST_PORT = 5055;
const MONGO_PORT = 27019;
process.env.MONGO_URI = `mongodb://127.0.0.1:${MONGO_PORT}/enjoy_test_db`;

const tempDbPath = path.join(__dirname, '.temp_mongo_test');
if (!fs.existsSync(tempDbPath)) {
  fs.mkdirSync(tempDbPath, { recursive: true });
}

const mongodPath = 'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe';

let mongodProc = null;
let serverInstance = null;

const results = [];

function recordResult(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} [${passed ? 'PASS' : 'FAIL'}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

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

async function waitForPort(port, host = '127.0.0.1', timeout = 10000) {
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

async function runTestSuite() {
  console.log('================================================================');
  console.log(' INICIANDO SUITE DE PRUEBAS FUNCIONALES DEL TP BACKEND (UTN)');
  console.log('================================================================\n');

  try {
    // 1. Iniciar MongoDB en proceso aislado de prueba
    console.log('[1/4] Iniciando instancia local de MongoDB en puerto ' + MONGO_PORT + '...');
    mongodProc = spawn(mongodPath, [
      '--dbpath',
      tempDbPath,
      '--port',
      String(MONGO_PORT),
      '--bind_ip',
      '127.0.0.1',
    ]);

    await waitForPort(MONGO_PORT, '127.0.0.1', 12000);
    console.log('  -> MongoDB iniciado correctamente y escuchando conexiones.\n');

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

    // PRUEBA 6: Rechazo de tokens inválidos o vencidos
    const resInvalidToken = await request(baseOpt('/api/usuarios', 'GET', { Authorization: 'Bearer token_invalido_corrupto' }));
    recordResult('6. Rechazo de tokens inválidos', resInvalidToken.status === 403, 'Responde HTTP 403 Forbidden');

    // PRUEBA 7: Protección de rutas sensibles (sin token)
    const resNoToken = await request(baseOpt('/api/servicios', 'POST'), {
      nombre: 'Servicio Inseguro',
      descripcion: 'Prueba',
      duracionMinutos: 40,
      precio: 5000,
    });
    recordResult('7. Protección de rutas sensibles', resNoToken.status === 401, 'POST /api/servicios sin token responde HTTP 401');

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

    // PRUEBA 8: CRUD completo de Categorías
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
    recordResult('8. CRUD completo de Categorías', resCatPost.status === 201 && resCatGet.status === 200 && resCatPut.status === 200 && resCatDelete.status === 200, 'POST 201, GET 200, PUT 200, DELETE 200');

    // Recreamos categoría para vincular producto
    const catFinal = await request(baseOpt('/api/categorias', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      nombre: 'Estimulación Lúdica',
      descripcion: 'Juegos didácticos',
    });
    const catRefId = catFinal.data?.data?._id;

    // PRUEBA 9: CRUD completo de Productos
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
    recordResult('9. CRUD completo de Productos', resProdPost.status === 201 && resProdGet.status === 200 && resProdPut.status === 200 && resProdDel.status === 200, 'POST 201, GET 200, PUT 200, DELETE 200');

    // PRUEBA 10: CRUD completo de Servicios
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
    recordResult('10. CRUD completo de Servicios', resServPost.status === 201 && resServGet.status === 200 && resServPut.status === 200 && resServDel.status === 200, 'POST 201, GET 200, PUT 200, DELETE 200');

    // Recreamos servicio para asociar turnos
    const servActivo = await request(baseOpt('/api/servicios', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      nombre: 'Atención Psicopedagógica Integral',
      descripcion: 'Admisión y evaluación',
      duracionMinutos: 50,
      precio: 8500,
      activo: true,
    });
    const servRefId = servActivo.data?.data?._id;

    // PRUEBA 11: CRUD completo de Turnos (y endpoint /solicitar del frontend)
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
    recordResult('11. CRUD de Turnos & Formulario Web', resTurnoPost.status === 201 && resTurnoGet.status === 200 && resTurnoPut.status === 200 && resTurnoDel.status === 200 && resTurnoSolicitar.status === 201, 'CRUD completo y endpoint /solicitar funcionando');

    // PRUEBA 12: Funcionamiento de populate
    const resTurnoParaPopulate = await request(baseOpt('/api/turnos', 'POST', { Authorization: `Bearer ${adminToken}` }), {
      pacienteId: registeredUser._id,
      servicioId: servRefId,
      fechaHora: new Date('2026-11-25T17:00:00Z'),
      motivoConsulta: 'Verificación populate',
    });
    const turnoPopulado = resTurnoParaPopulate.data?.data;
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

    console.log('================================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(` RESUMEN: ${passedCount} / ${results.length} PRUEBAS EXITOSAS`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('Error fatal durante la ejecución de las pruebas:', error);
  } finally {
    // Limpieza de procesos y base de datos
    console.log('Limpiando entorno de pruebas...');
    try {
      if (mongoose.connection.readyState !== 0) {
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
