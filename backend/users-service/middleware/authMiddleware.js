const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const err = new Error('No hay sesión activa');
        err.status = 401;
        return next(err);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 1. Verificar si la sesión existe en la base de datos
        const activeSession = await Session.findOne({ token, userId: decoded.id });
        if (!activeSession) {
            const err = new Error('Sesión inválida o cerrada');
            err.status = 401;
            return next(err);
        }

        // 2. Verificar si el usuario está bloqueado
        const user = await User.findById(decoded.id);
        if (!user || user.isBlocked) {
            const err = new Error('Acceso denegado. El usuario ha sido bloqueado o ya no existe.');
            err.status = 403;
            // Opcional: Limpiar sesiones si está bloqueado
            if (user && user.isBlocked) {
                await Session.deleteMany({ userId: user._id });
            }
            return next(err);
        }

        // ACTUALIZADO: Extraer todo el payload enriquecido
        req.user = { 
            id: decoded.id,
            username: decoded.username,
            role: decoded.role || 'user',
            token: token
        };
        
        next();
    } catch (error) {
        const err = new Error('Sesión expirada o inválida');
        err.status = 401;
        next(err);
    }
};