# API RESTful con CRUD y Capa de Servicios — En-Joy Psicopedagogía

> **Trabajo Práctico Final — Curso de Backend Developer**  
> **Centro de e-Learning UTN BA (Universidad Tecnológica Nacional)**  
> **Dominio:** En-Joy Psicopedagogía (Gestión Integral de Turnos, Servicios Terapéuticos y Usuarios)

---

## 3. Título y Breve Descripción del Proyecto

**En-Joy Psicopedagogía API** es una solución backend construida bajo la arquitectura RESTful en Node.js, Express y MongoDB (Mongoose), aplicando el patrón de **Separación de Responsabilidades** a través de una **Capa de Servicios (`services/`)**. 

El sistema provee una plataforma segura y escalable para:
1. **Autenticación y Autorización:** Registro, inicio de sesión seguro con contraseñas encriptadas mediante `bcrypt` (en pre-save hooks) y generación/validación de `JSON Web Tokens (JWT)`.
2. **Gestión de Servicios Psicoterapéuticos:** CRUD completo para catálogo de prestaciones clínicas.
3. **Gestión de Turnos y Agenda de Consultas:** CRUD completo con relaciones referenciadas entre pacientes y servicios utilizando `.populate()` de Mongoose.
4. **Integración con Formulario Web:** Endpoint especializado para recepcionar solicitudes de admisión y turnos directamente desde el frontend institucional de En-Joy Psicopedagogía.
5. **Compatibilidad con Enunciado Base:** Modelos y rutas para `Productos` y `Categorías` con relaciones referenciadas.

---

## 4. Esquema de la Base de Datos (Estructura de las Colecciones)

El diseño del esquema NoSQL está optimizado para la consistencia del dominio clínico psicopedagógico (conforme al diseño presentado en `EVALUACION_DISENO_DB.md`):

```mermaid
erDiagram
    User ||--o{ Turno : "agenda / pertenece a (1:N)"
    Service ||--o{ Turno : "asignado en (1:N)"
    Category ||--o{ Product : "clasifica (1:N)"

    User {
        ObjectId _id PK
        string nombre
        string email "UK, index"
        string password "Hashed bcrypt"
        string telNumber
        date fechaNacimiento
        string genero "m / f / otro"
        string rol "admin / paciente"
        date fechaRegistro
        date createdAt
        date updatedAt
    }

    Service {
        ObjectId _id PK
        string nombre
        string descripcion
        int duracionMinutos
        double precio
        boolean activo
        date createdAt
        date updatedAt
    }

    Turno {
        ObjectId _id PK
        ObjectId pacienteId FK "Ref -> User"
        ObjectId servicioId FK "Ref -> Service"
        date fechaHora "Index compuesto con estado"
        string estado "pendiente / confirmado / cancelado"
        string motivoConsulta
        string comentarios
        date fechaCreacion
        date createdAt
        date updatedAt
    }

    Category {
        ObjectId _id PK
        string nombre "UK"
        string descripcion
    }

    Product {
        ObjectId _id PK
        string nombre
        string descripcion
        double precio
        int stock
        ObjectId categoria FK "Ref -> Category"
    }
```

### Justificación de Relaciones y Poblado (`populate`)
- **Turnos $\leftrightarrow$ Usuarios y Servicios:** Se utiliza **referenciación** mediante `ObjectId` (`ref: 'User'` y `ref: 'Service'`). La psicopedagoga y el catálogo de servicios son entidades maestras; referenciarlas evita duplicaciones masivas y asegura que al modificar precios o datos del usuario, el historial no quede desfasado. En las operaciones de lectura `GET /api/turnos`, se ejecuta `.populate('pacienteId')` y `.populate('servicioId')` para devolver los datos completos asociados.
- **Productos $\leftrightarrow$ Categorías:** La entidad Producto guarda una referencia a Categoría (`ref: 'Category'`), resuelta mediante `.populate('categoria')`.

---

## 5. Listado de Tecnologías Utilizadas

- **Entorno de ejecución:** [Node.js](https://nodejs.org/) (v18+)
- **Framework Web:** [Express.js](https://expressjs.com/) (v4.x)
- **Base de Datos NoSQL:** [MongoDB](https://www.mongodb.com/)
- **ODM (Object Data Modeling):** [Mongoose](https://mongoosejs.com/) (v8.x)
- **Seguridad y Encriptación:** [bcryptjs](https://www.npmjs.com/package/bcryptjs) (hashing de contraseñas con salting en pre-save hooks)
- **Autenticación:** [jsonwebtoken (JWT)](https://jwt.io/) (tokens de acceso firmados)
- **Variables de Entorno:** [dotenv](https://www.npmjs.com/package/dotenv)
- **Middleware CORS:** [cors](https://www.npmjs.com/package/cors)
- **Logger HTTP:** [morgan](https://www.npmjs.com/package/morgan)
- **Recarga en vivo en desarrollo:** [nodemon](https://www.npmjs.com/package/nodemon)

---

## 6. Instrucciones Claras de Instalación y Ejecución

### Prerrequisitos
- Tener instalado **Node.js** (versión 18 o superior).
- Tener una instancia de **MongoDB** activa (local en `mongodb://127.0.0.1:27017` o una cuenta en **MongoDB Atlas**).

### Paso 1: Clonar o situarse en el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd "Tp Desarrollo web UTN/backend"
```

### Paso 2: Instalar las dependencias
```bash
npm install
```

### Paso 3: Configurar variables de entorno
Cree su archivo `.env` a partir del archivo de ejemplo provisto:
```bash
cp .env.example .env
```
Asegúrese de que los valores en `.env` coincidan con su entorno:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/enjoy_psicopedagogia
JWT_SECRET=super_secret_jwt_key_utn_enjoy_2026
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### Paso 4: Poblar la base de datos con datos de prueba (Seed Mock)
Ejecute el comando de sembrado para cargar automáticamente usuarios (con contraseñas ya hasheadas), servicios y turnos referenciados:
```bash
npm run seed
```

### Paso 5: Iniciar el servidor
- **Modo Desarrollo (con auto-reload con nodemon):**
  ```bash
  npm run dev
  ```
- **Modo Producción:**
  ```bash
  npm start
  ```
El servidor quedará disponible en: `http://localhost:5000`.

---

## 7. Listado Completo de Endpoints Disponibles

### Autenticación y Usuarios (`/api/usuarios` o `/api/users`)
| Método | Endpoint | Acceso / Seguridad | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/usuarios/register` | Público | Registra un usuario y retorna su token JWT |
| `POST` | `/api/usuarios/login` | Público | Inicia sesión verificando credenciales y emitiendo JWT |
| `GET` | `/api/usuarios` | Protegido (Bearer Token) | Lista todos los usuarios registrados |
| `GET` | `/api/usuarios/:id` | Protegido (Bearer Token) | Obtiene el detalle de un usuario por su ID |
| `PUT` | `/api/usuarios/:id` | Protegido (Bearer Token) | Actualiza datos de un usuario |
| `DELETE` | `/api/usuarios/:id` | Protegido (Admin Token) | Elimina un usuario por su ID |

### Catálogo de Servicios (`/api/servicios` o `/api/services`)
| Método | Endpoint | Acceso / Seguridad | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/servicios` | Público | Lista todos los servicios (soporta `?activo=true&search=...`) |
| `GET` | `/api/servicios/:id` | Público | Obtiene el detalle de un servicio por su ID |
| `POST` | `/api/servicios` | Protegido (Bearer Token) | Crea un nuevo servicio terapéutico |
| `PUT` | `/api/servicios/:id` | Protegido (Bearer Token) | Actualiza precio, duración o datos de un servicio |
| `DELETE` | `/api/servicios/:id` | Protegido (Bearer Token) | Elimina un servicio |

### Gestión de Turnos (`/api/turnos`)
| Método | Endpoint | Acceso / Seguridad | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/turnos/solicitar` | Público (Front Web) | Crea/vincula paciente y agenda turno desde la web |
| `GET` | `/api/turnos` | Protegido (Bearer Token) | Lista todos los turnos con `.populate('pacienteId', 'servicioId')` |
| `GET` | `/api/turnos/:id` | Protegido (Bearer Token) | Obtiene un turno por ID con sus datos referenciados |
| `POST` | `/api/turnos` | Protegido (Bearer Token) | Crea un turno vinculando `pacienteId` y `servicioId` |
| `PUT` | `/api/turnos/:id` | Protegido (Bearer Token) | Actualiza estado (ej. de 'pendiente' a 'confirmado') |
| `DELETE` | `/api/turnos/:id` | Protegido (Bearer Token) | Cancela / elimina un turno |

### Productos y Categorías (Enunciado Clásico: `/api/productos`, `/api/categorias`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categorias` | Público | Lista todas las categorías |
| `POST` | `/api/categorias` | Protegido | Crea una categoría |
| `DELETE` | `/api/categorias/:id` | Protegido | Elimina una categoría |
| `GET` | `/api/productos` | Público | Lista productos con `.populate('categoria')` |
| `GET` | `/api/productos/:id` | Público | Detalle de un producto con categoría poblada |
| `POST` | `/api/productos` | Protegido | Crea un producto validando su categoría |
| `PUT` | `/api/productos/:id` | Protegido | Actualiza un producto |
| `DELETE` | `/api/productos/:id` | Protegido | Elimina un producto |

---

## 8. Ejemplos de Datos Mock (Formato JSON) para Todas las Solicitudes

### 1. Registro de Usuario (`POST /api/usuarios/register`)
**Request:**
```json
{
  "nombre": "Carolina Gómez",
  "email": "carolina.gomez@gmail.com",
  "password": "Password123!",
  "telNumber": "+543364556677",
  "fechaNacimiento": "1992-07-15",
  "genero": "f",
  "rol": "paciente"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "_id": "6724a1b2c3d4e5f6a7b8c9d0",
      "nombre": "Carolina Gómez",
      "email": "carolina.gomez@gmail.com",
      "telNumber": "+543364556677",
      "fechaNacimiento": "1992-07-15T00:00:00.000Z",
      "genero": "f",
      "rol": "paciente",
      "fechaRegistro": "2026-10-31T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Inicio de Sesión / Login (`POST /api/usuarios/login`)
**Request:**
```json
{
  "email": "joyreche@gmail.com",
  "password": "AdminPassword123!"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "_id": "60d5ec481f3c882b548b4561",
      "nombre": "Joana Reche",
      "email": "joyreche@gmail.com",
      "rol": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Crear Servicio (`POST /api/servicios`) — Requiere Token en Header
**Header:** `Authorization: Bearer <token>`  
**Request:**
```json
{
  "nombre": "Evaluación Psicopedagógica Integral",
  "descripcion": "Batería de pruebas neuropsicológicas y de aprendizaje.",
  "duracionMinutos": 60,
  "precio": 12000,
  "activo": true
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Servicio creado exitosamente",
  "data": {
    "_id": "6724b1112233445566778899",
    "nombre": "Evaluación Psicopedagógica Integral",
    "descripcion": "Batería de pruebas neuropsicológicas y de aprendizaje.",
    "duracionMinutos": 60,
    "precio": 12000,
    "activo": true,
    "createdAt": "2026-10-31T12:10:00.000Z"
  }
}
```

### 4. Consultar Turnos con Populate (`GET /api/turnos`) — Requiere Token
**Header:** `Authorization: Bearer <token>`  
**Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "60d5ee111f3c882b548b4581",
      "fechaHora": "2026-09-01T15:00:00.000Z",
      "estado": "confirmado",
      "motivoConsulta": "Desafíos en el cálculo matemático y razonamiento lógico",
      "comentarios": "Primera consulta para diagnóstico.",
      "pacienteId": {
        "_id": "60d5ec481f3c882b548b4562",
        "nombre": "Martín Pérez",
        "email": "martinperez@gmail.com",
        "telNumber": "+543364112233",
        "fechaNacimiento": "2018-08-20T00:00:00.000Z",
        "genero": "m"
      },
      "servicioId": {
        "_id": "60d5ed291f3c882b548b4571",
        "nombre": "Estimulación Cognitiva",
        "descripcion": "Ejercicios de estimulación cognitiva matemática y razonamiento lógico lúdico.",
        "duracionMinutos": 45,
        "precio": 8500,
        "activo": true
      }
    }
  ]
}
```

### 5. Enviar Solicitud de Turno desde el Frontend (`POST /api/turnos/solicitar`)
**Request:**
```json
{
  "nombre": "Lucas Morales",
  "email": "lucas.morales@gmail.com",
  "telNumber": "+543364778899",
  "date": "2017-04-10",
  "genero": "m",
  "motivoConsulta": "Problemas de concentración y atención en clase",
  "comentarios": "Derivado por el equipo directivo del colegio."
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Solicitud de turno enviada y registrada con éxito",
  "data": {
    "_id": "6724c9988776655443322110",
    "estado": "pendiente",
    "motivoConsulta": "Problemas de concentración y atención en clase",
    "pacienteId": {
      "_id": "6724c9988776655443322109",
      "nombre": "Lucas Morales",
      "email": "lucas.morales@gmail.com"
    },
    "servicioId": {
      "_id": "60d5ed291f3c882b548b4571",
      "nombre": "Consulta Psicopedagógica Inicial",
      "precio": 8500
    }
  }
}
```

---

## 9. Funcionalidades Implementadas y a Futuro

### Funcionalidades Implementadas
- [x] Arquitectura en tres capas: Rutas $\rightarrow$ Controladores $\rightarrow$ Capa de Servicios $\rightarrow$ Modelos Mongoose.
- [x] CRUD completo para Servicios, Turnos, Usuarios, Productos y Categorías.
- [x] Hash seguro de contraseñas mediante `bcrypt` en hook pre-save de Mongoose.
- [x] Autenticación mediante tokens JWT y middleware `verifyToken`.
- [x] Middleware `verifyAdmin` para operaciones privilegiadas.
- [x] Relaciones con integridad referencial y resolución de datos mediante `.populate()`.
- [x] Manejo uniforme de respuestas HTTP con códigos apropiados (200, 201, 400, 401, 403, 404, 500) y manejo de excepciones mediante `try/catch`.
- [x] Habilitación de CORS para consumo directo desde SPA en React (Vite).
- [x] Script de sembrado inicial (`npm run seed`) con datos de prueba realistas.
- [x] Variables de entorno centralizadas vía `dotenv`.

### Funcionalidades a Futuro
- [ ] Recordatorios automatizados por correo electrónico (Nodemailer) y WhatsApp para turnos confirmados.
- [ ] Integración con pasarela de pagos (Mercado Pago / Stripe) para señar turnos en línea.
- [ ] Módulo de historia clínica con subida de informes psicopedagógicos en PDF (Amazon S3 / Cloudinary).
- [ ] Panel de métricas y gráficos estadísticos para la psicopedagoga (horas semanales, ingresos mensuales).

---

## 10. Archivo .env

Se provee un archivo `.env` configurado para pruebas locales inmediatas y un archivo `.env.example` con las variables requeridas:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/enjoy_psicopedagogia
JWT_SECRET=super_secret_jwt_key_utn_enjoy_2026
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

