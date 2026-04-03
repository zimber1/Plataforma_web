const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, msg: 'No se proporcionó token de autenticación' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificación Robusta: Revisar si la sesión sigue activa en la BD
        const activeSession = await Session.findOne({ token, userId: decoded.id });
        if (!activeSession) {
            return res.status(401).json({ success: false, msg: 'Sesión inválida o cerrada' });
        }

        req.user = { 
            id: decoded.id,
            username: decoded.username,
            role: decoded.role || 'user'
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ success: false, msg: 'Token inválido o expirado' });
    }
};
