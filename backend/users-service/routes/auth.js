const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authController = require('../controllers/authController');

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

module.exports = router;