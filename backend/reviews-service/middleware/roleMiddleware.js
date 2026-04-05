module.exports = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, msg: 'Acceso denegado: No se pudo verificar el rol' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                msg: `Acceso denegado: Se requiere el rol ${roles.join(' o ')}` 
            });
        }

        next();
    };
};
