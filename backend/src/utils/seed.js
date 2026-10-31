require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const Turno = require('../models/turnoModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/enjoy_psicopedagogia';
    console.log(`[Seed] Conectando a MongoDB en: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[Seed] Conexión establecida con éxito.');

    // Limpieza de colecciones previas
    console.log('[Seed] Limpiando colecciones existentes...');
    await User.deleteMany({});
    await Service.deleteMany({});
    await Turno.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // 1. Inserción de Usuarios de Mock (de EVALUACION_DISENO_DB.md)
    console.log('[Seed] Creando usuarios...');
    const adminUser = await User.create({
      nombre: 'Joana Reche',
      email: 'joyreche@gmail.com',
      password: 'AdminPassword123!',
      telNumber: '+543364206772',
      fechaNacimiento: new Date('1994-05-12T00:00:00Z'),
      genero: 'f',
      rol: 'admin',
      fechaRegistro: new Date('2026-01-10T12:00:00Z'),
    });

    const paciente1 = await User.create({
      nombre: 'Martín Pérez',
      email: 'martinperez@gmail.com',
      password: 'Paciente123!',
      telNumber: '+543364112233',
      fechaNacimiento: new Date('2018-08-20T00:00:00Z'),
      genero: 'm',
      rol: 'paciente',
      fechaRegistro: new Date('2026-08-15T09:30:00Z'),
    });

    const paciente2 = await User.create({
      nombre: 'Sofía Rodríguez',
      email: 'sofiarodriguez@gmail.com',
      password: 'Paciente123!',
      telNumber: '+543364998877',
      fechaNacimiento: new Date('2016-03-14T00:00:00Z'),
      genero: 'f',
      rol: 'paciente',
      fechaRegistro: new Date('2026-08-20T11:15:00Z'),
    });

    // 2. Inserción de Servicios (de EVALUACION_DISENO_DB.md)
    console.log('[Seed] Creando servicios psicopedagógicos...');
    const servicio1 = await Service.create({
      nombre: 'Estimulación Cognitiva',
      descripcion: 'Ejercicios de estimulación cognitiva matemática y razonamiento lógico lúdico.',
      duracionMinutos: 45,
      precio: 8500.0,
      activo: true,
    });

    const servicio2 = await Service.create({
      nombre: 'Alfabetización Lúdica',
      descripcion: 'Acompañamiento en el proceso de lectoescritura mediante metodologías de juego.',
      duracionMinutos: 50,
      precio: 9000.0,
      activo: true,
    });

    const servicio3 = await Service.create({
      nombre: 'Taller Educativo Grupal',
      descripcion: 'Taller educativo de habilidades sociales y recreación guiada en grupos reducidos.',
      duracionMinutos: 90,
      precio: 6500.0,
      activo: true,
    });

    // 3. Inserción de Turnos Referenciados (con pacienteId y servicioId)
    console.log('[Seed] Creando turnos vinculados con referencias (populate)...');
    await Turno.create([
      {
        pacienteId: paciente1._id,
        servicioId: servicio1._id,
        fechaHora: new Date('2026-09-01T15:00:00Z'),
        estado: 'confirmado',
        motivoConsulta: 'Desafíos en el cálculo matemático y razonamiento lógico (discalculia)',
        comentarios: 'Deseo agendar la primera consulta para diagnóstico de problemas de concentración en matemática escolar.',
        fechaCreacion: new Date('2026-08-27T10:00:00Z'),
      },
      {
        pacienteId: paciente2._id,
        servicioId: servicio2._id,
        fechaHora: new Date('2026-09-02T17:30:00Z'),
        estado: 'pendiente',
        motivoConsulta: 'Problemas en la adquisición de la lectoescritura (dislexia, retraso lector, dificultades de comprensión)',
        comentarios: 'Solicitud de turno para fortalecimiento de lectoescritura inicial en primer grado.',
        fechaCreacion: new Date('2026-08-27T11:20:00Z'),
      },
    ]);

    // 4. Inserción de Categorías y Productos (para compatibilidad con el enunciado clásico)
    console.log('[Seed] Creando categorías y productos del enunciado base...');
    const catMateriales = await Category.create({
      nombre: 'Material Didáctico',
      descripcion: 'Materiales terapéuticos y juegos didácticos de estimulación psicopedagógica',
    });

    const catLibros = await Category.create({
      nombre: 'Guías y Cuadernillos',
      descripcion: 'Cuadernillos prácticos de ejercitación para el hogar y la escuela',
    });

    await Product.create([
      {
        nombre: 'Set de Bloques Lógicos de Madera',
        descripcion: 'Bloques geométricos para estimulación del razonamiento abstracto',
        precio: 4500.0,
        stock: 15,
        categoria: catMateriales._id,
      },
      {
        nombre: 'Cuadernillo de Grafomotricidad y Lectoescritura',
        descripcion: 'Actividades progresivas para niños de 5 a 8 años',
        precio: 3200.0,
        stock: 30,
        categoria: catLibros._id,
      },
    ]);

    console.log('================================================================');
    console.log(' SEED COMPLETADO EXITOSAMENTE');
    console.log('================================================================');
    console.log('Usuarios de prueba creados:');
    console.log(`- Administrador: joyreche@gmail.com / Contraseña: AdminPassword123! (Rol: ${adminUser.rol})`);
    console.log(`- Paciente 1:   martinperez@gmail.com / Contraseña: Paciente123! (Rol: ${paciente1.rol})`);
    console.log(`- Paciente 2:   sofiarodriguez@gmail.com / Contraseña: Paciente123! (Rol: ${paciente2.rol})`);
    console.log(`- Servicios creados: ${servicio1.nombre}, ${servicio2.nombre}, ${servicio3.nombre}`);
    console.log('================================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Error durante el proceso de inicialización:', error);
    process.exit(1);
  }
};

seedDatabase();

