const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const err = new Error('Se requiere iniciar sesión');
        err.status = 401;
        return next(err);
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Extraer todo lo útil del payload
        req.user = { 
            id: decoded.id,
            username: decoded.username,
            role: decoded.role || 'user'
        };
        next();
    } catch (error) {
        const err = new Error('Sesión expirada o inválida');
        err.status = 401;
        next(err);
    }
};