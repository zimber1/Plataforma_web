const User = require('../models/User');
const Cpu = require('../models/Cpu');
const Gpu = require('../models/Gpu');
const Ram = require('../models/Ram');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generar Token JWT
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
        const { username, email, password, pcSpecs } = req.body;

        // 1. Validaciones básicas de Usuario
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

        // 2. VALIDACIÓN DE HARDWARE (Si envía pcSpecs)
        // El front debe mandar el nombre exacto que seleccionó del autocompletado
        if (pcSpecs) {
            // Validar CPU
            if (pcSpecs.cpu) {
                const validCpu = await Cpu.findOne({ name: pcSpecs.cpu });
                if (!validCpu) {
                    const err = new Error(`El CPU '${pcSpecs.cpu}' no es válido. Seleccione uno de la lista.`);
                    err.status = 400;
                    throw err;
                }
            }
            // Validar GPU
            if (pcSpecs.gpu) {
                const validGpu = await Gpu.findOne({ name: pcSpecs.gpu });
                if (!validGpu) {
                    const err = new Error(`La GPU '${pcSpecs.gpu}' no es válida.`);
                    err.status = 400;
                    throw err;
                }
            }
            // Validar RAM
            if (pcSpecs.ram) {
                const validRam = await Ram.findOne({ name: pcSpecs.ram });
                if (!validRam) {
                    const err = new Error(`La RAM '${pcSpecs.ram}' no es válida.`);
                    err.status = 400;
                    throw err;
                }
            }
            // Nota: El SO (pcSpecs.os) no lo validamos contra DB, confiamos en el dropdown del front
        }

        // 3. Crear usuario
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'user',
            pcSpecs: pcSpecs || {}
        });

        res.status(201).json({
            success: true,
            token: generateToken(user),
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                pcSpecs: user.pcSpecs
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    // ... (Tu login se queda igual, no necesita cambios)
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            const err = new Error('Credenciales inválidas');
            err.status = 400;
            throw err;
        }

        res.json({
            success: true,
            token: generateToken(user),
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                pcSpecs: user.pcSpecs
            }
        });
    } catch (error) {
        next(error);
    }
};