# En-Joy Psicopedagogía — Proyecto Full-Stack Web & Backend API

> **Universidad Tecnológica Nacional (UTN) — Centro de e-Learning UTN BA**  
> **Trabajo Práctico Final — Desarrollo Web & Backend Developer**  
> **Autora / Titular:** Lic. Joana Reche — En-Joy Psicopedagogía  
> **Desarrollador:** Jano Duarte

---

## 🌟 Descripción General del Proyecto

**En-Joy Psicopedagogía** es una plataforma web integral diseñada para la gestión clínica, divulgación de servicios y agenda de turnos de un consultorio psicopedagógico. 

El repositorio unifica:
1. **Frontend (SPA en React + Vite):** Portal interactivo para pacientes y tutores, con catálogo de servicios terapéuticos, información profesional, galería de actividades y formulario de solicitud de turnos.
2. **Backend (API RESTful en Node.js + Express + MongoDB):** Servidor con arquitectura en capas (**Capa de Servicios**, Controladores, Rutas y Modelos Mongoose), autenticación y autorización mediante **JWT**, encriptación con **bcrypt** en hooks pre-save, y relaciones referenciadas con **populate**.
3. **Diseño de Base de Datos NoSQL:** Esquema documentado y justificado en `EVALUACION_DISENO_DB.md`.

---

## 📁 Estructura del Repositorio

```text
Tp Desarrollo web UTN/
├── backend/                             # Servidor Backend (API RESTful)
│   ├── app.js                          # Punto de entrada principal Express
│   ├── .env                            # Variables de entorno locales
│   ├── .env.example                    # Plantilla de variables de entorno
│   ├── package.json                    # Dependencias y scripts del backend
│   ├── README.md                       # Documentación técnica completa del backend (10 puntos UTN)
│   └── src/
│       ├── config/
│       │   └── db.js                   # Conexión a MongoDB (Mongoose)
│       ├── middleware/
│       │   └── verifyToken.js          # Middleware de autenticación JWT y roles
│       ├── models/
│       │   ├── userModel.js            # Modelo de Usuarios (bcrypt hook + JWT)
│       │   ├── serviceModel.js         # Modelo de Servicios Psicopedagógicos
│       │   ├── turnoModel.js           # Modelo de Turnos (referencia a User y Service)
│       │   ├── categoryModel.js        # Modelo de Categorías (enunciado base)
│       │   └── productModel.js         # Modelo de Productos con ref a Categoría
│       ├── services/                   # Capa de Servicios (Lógica de Negocio y Mongoose)
│       │   ├── userService.js
│       │   ├── serviceService.js
│       │   ├── turnoService.js
│       │   ├── categoryService.js
│       │   └── productService.js
│       ├── controllers/                # Controladores HTTP ligeros
│       │   ├── userController.js
│       │   ├── serviceController.js
│       │   ├── turnoController.js
│       │   ├── categoryController.js
│       │   └── productController.js
│       ├── routes/                     # Definición de rutas y endpoints REST
│       │   ├── userRoute.js
│       │   ├── serviceRoute.js
│       │   ├── turnoRoute.js
│       │   ├── categoryRoute.js
│       │   └── productRoute.js
│       └── utils/
│           └── seed.js                 # Script para sembrar datos iniciales de prueba
│
├── src/                                # Frontend SPA (React + Vite)
│   ├── components/                     # Componentes reutilizables (Navbar, Footer, Card)
│   ├── pages/                          # Vistas (Home, About, Gallery/Servicios, Contact)
│   ├── hooks/                          # Custom Hooks (useForm con validaciones)
│   ├── styles/                         # Hojas de estilo modulares CSS
│   ├── assets/                         # Imágenes institucionales y recursos visuales
│   ├── App.jsx                         # Enrutamiento React Router
│   └── main.jsx                        # Punto de entrada React
│
├── EVALUACION_DISENO_DB.md             # Documentación del diseño de base de datos UTN
├── package.json                        # Scripts globales y dependencias del frontend
├── vite.config.js                      # Configuración de compilación Vite
└── README.md                           # Documentación principal
```

---

## 🚀 Puesta en Marcha Rápida (Cómo Correr el Proyecto)

### 1. Iniciar el Backend (API RESTful)

1. Ingrese a la carpeta `backend` o use los scripts desde la raíz:
   ```bash
   cd backend
   npm install
   ```
2. Configure las variables de entorno (por defecto ya viene listo el `.env` con conexión local):
   ```bash
   cp .env.example .env
   ```
3. *(Opcional)* Si tiene MongoDB corriendo, ejecute el sembrado de datos de prueba:
   ```bash
   npm run seed
   ```
4. Inicie el servidor:
   ```bash
   npm run dev
   ```
   > El backend estará escuchando en `http://localhost:5000`.

### 2. Iniciar el Frontend (React SPA)

En una terminal separada, desde la raíz del proyecto:
```bash
npm install
npm run dev
```
> La aplicación web abrirá en `http://localhost:5173`.

Al enviar el formulario de contacto en `http://localhost:5173/contacto`, la solicitud se conectará directamente a `http://localhost:5000/api/turnos/solicitar` guardando el paciente y el turno en MongoDB.

---

## 🔑 Credenciales de Prueba (Seed Mock)

Si ejecutó `npm run seed` en el backend, cuenta con las siguientes cuentas precargadas:

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `joyreche@gmail.com` | `AdminPassword123!` |
| **Paciente** | `martinperez@gmail.com` | `Paciente123!` |
| **Paciente** | `sofiarodriguez@gmail.com` | `Paciente123!` |

Para más detalles sobre los endpoints, tokens JWT y ejemplos JSON de solicitudes, consulte [backend/README.md](file:///backend/README.md).
