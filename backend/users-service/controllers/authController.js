const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generar Token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Sesión válida por 30 días
    });
};

exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // 1. Verificar si el usuario ya existe
        let userExists = await User.findOne({ email });
        if (userExists) {
            const err = new Error('El correo ya está registrado');
            err.status = 400;
            throw err;
        }
        
        userExists = await User.findOne({ username });
        if (userExists) {
            const err = new Error('El nombre de usuario ya está en uso');
            err.status = 400;
            throw err;
        }

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Crear usuario
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // 4. Responder con Token (para login automático al registrarse)
        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        next(error); // Pasa el error al middleware global
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('Credenciales inválidas');
            err.status = 400;
            throw err;
        }

        // 2. Comparar contraseñas
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const err = new Error('Credenciales inválidas');
            err.status = 400;
            throw err;
        }

        // 3. Responder con Token
        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                pcSpecs: user.pcSpecs // Devolvemos esto para que el Front sepa si ya configuró su PC
            }
        });

    } catch (error) {
        next(error); // Pasa el error al middleware global
    }
};

// TODO: Implementar Reset Password (requiere servicio de email o flujo de tokens)