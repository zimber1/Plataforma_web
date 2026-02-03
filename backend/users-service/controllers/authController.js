const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generar Token JWT (Ahora incluye ID, username y rol)
const generateToken = (user) => {
    return jwt.sign({ 
        id: user._id,
        username: user.username,
        role: user.role || 'user',
        pcSpecs: user.pcSpecs || {}
    }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};


exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario (con rol por defecto)
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'user'
        });

        res.status(201).json({
            success: true,
            token: generateToken(user), // Token enriquecido
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('Credenciales inválidas');
            err.status = 400;
            throw err;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const err = new Error('Credenciales inválidas');
            err.status = 400;
            throw err;
        }

        res.json({
            success: true,
            token: generateToken(user), // Token enriquecido
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                pcSpecs: user.pcSpecs
            }
        });

    } catch (error) {
        next(error);
    }
};