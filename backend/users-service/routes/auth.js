const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware para permitir solo reviewer/admin
const reviewerOrAdminOnly = (req, res, next) => {
    const allowedRoles = ['reviewer', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            msg: 'No tienes permisos para consultar specs de otros usuarios'
        });
    }
    next();
};


// Middleware para revisar errores de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// @route   POST /api/auth/register
// @desc    Registrar usuario
router.post('/register', [
    check('username', 'El nombre de usuario es obligatorio').not().isEmpty(),
    check('email', 'Agrega un email válido').isEmail(),
    check('password', 'El password debe tener mínimo 6 caracteres').isLength({ min: 6 })
], validate, authController.register);

// @route   POST /api/auth/login
// @desc    Iniciar sesión
router.post('/login', [
    check('email', 'Agrega un email válido').isEmail(),
    check('password', 'El password es obligatorio').exists()
], validate, authController.login);

// @route   GET /api/auth/me
// @desc    Obtener perfil del usuario autenticado
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/specs
// @desc    Actualizar specs de PC del usuario
router.put('/specs', authMiddleware, authController.updateSpecs);


// @route   GET /api/auth/reviewer/users/:userId/specs
// @desc    Obtener specs de un usuario para revisión (reviewer/admin)
router.get('/reviewer/users/:userId/specs', authMiddleware, reviewerOrAdminOnly, authController.getUserSpecsForReviewer);

module.exports = router;