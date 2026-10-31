const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar la validez del JSON Web Token (JWT)
 * Protege las rutas sensibles de creación, actualización y eliminación.
 */
const verifyToken = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Error de configuración del servidor: JWT_SECRET no está configurada',
    });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: No se proporcionó un token o el formato es inválido (Bearer <token>)',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adjuntamos los datos decodificados del usuario (id, email, rol, nombre)
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor inicie sesión nuevamente.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token inválido o no reconocido.',
    });
  }
};

/**
 * Middleware para restringir acceso exclusivo a usuarios con rol 'admin'
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Se requieren permisos de Administrador.',
    });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
};
