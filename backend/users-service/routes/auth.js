const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

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

// @route   POST /api/auth/logout
// @desc    Cerrar sesión en este dispositivo
router.post('/logout', authMiddleware, authController.logout);

// @route   POST /api/auth/logout-all
// @desc    Cerrar sesión en todos los dispositivos
router.post('/logout-all', authMiddleware, authController.logoutAll);

// @route   PUT /api/auth/change-password
// @desc    Cambiar contraseña (invalida todas las sesiones)
router.put('/change-password', [
    authMiddleware,
    check('currentPassword', 'La contraseña actual es obligatoria').exists(),
    check('newPassword', 'La nueva contraseña debe tener mínimo 6 caracteres').isLength({ min: 6 })
], validate, authController.changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Solicitar enlace de recuperación
router.post('/forgot-password', [
    check('email', 'Agrega un email válido').isEmail()
], validate, authController.forgotPassword);

// @route   PUT /api/auth/reset-password/:token
// @desc    Restablecer contraseña usando token
router.put('/reset-password/:token', [
    check('password', 'La nueva contraseña debe tener mínimo 6 caracteres').isLength({ min: 6 })
], validate, authController.resetPassword);

module.exports = router;