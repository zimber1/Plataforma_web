const User = require('../models/User');
const Cpu = require('../models/Cpu');
const Gpu = require('../models/Gpu');
const Ram = require('../models/Ram');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const crypto = require('crypto');

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
        if (pcSpecs) {
            if (pcSpecs.cpu) {
                const validCpu = await Cpu.findOne({ name: pcSpecs.cpu });
                if (!validCpu) {
                    const err = new Error(`El CPU '${pcSpecs.cpu}' no es válido. Seleccione uno de la lista.`);
                    err.status = 400;
                    throw err;
                }
            }
            if (pcSpecs.gpu) {
                const validGpu = await Gpu.findOne({ name: pcSpecs.gpu });
                if (!validGpu) {
                    const err = new Error(`La GPU '${pcSpecs.gpu}' no es válida.`);
                    err.status = 400;
                    throw err;
                }
            }
            if (pcSpecs.ram) {
                const validRam = await Ram.findOne({ name: pcSpecs.ram });
                if (!validRam) {
                    const err = new Error(`La RAM '${pcSpecs.ram}' no es válida.`);
                    err.status = 400;
                    throw err;
                }
            }
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

        const token = generateToken(user);

        // EXTRA: Guardar sesión en BD para permitir múltiples dispositivos
        await Session.create({
            userId: user._id,
            token: token,
            deviceInfo: req.headers['user-agent'] || 'Dispositivo Desconocido',
            ipAddress: req.ip || req.connection.remoteAddress,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        });

        res.status(201).json({
            success: true,
            token,
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
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            const err = new Error('Credenciales inválidas');
            err.status = 400;
            throw err;
        }

        const token = generateToken(user);

        // EXTRA: Guardar sesión en BD para múltiples dispositivos
        await Session.create({
            userId: user._id,
            token: token,
            deviceInfo: req.headers['user-agent'] || 'Dispositivo Desconocido',
            ipAddress: req.ip || req.connection.remoteAddress,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        });

        res.json({
            success: true,
            token,
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

// Actualizar specs de PC del usuario
exports.updateSpecs = async (req, res, next) => {
    try {
        const { pcSpecs } = req.body;
        const userId = req.user.id;

        if (!pcSpecs || typeof pcSpecs !== 'object') {
            const err = new Error('Se requiere un objeto pcSpecs válido');
            err.status = 400;
            throw err;
        }

        const userExists = await User.findById(userId);
        if (!userExists) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }

        const validationErrors = [];
        if (pcSpecs.cpu) {
            const validCpu = await Cpu.findOne({ name: pcSpecs.cpu });
            if (!validCpu) {
                validationErrors.push(`CPU '${pcSpecs.cpu}' no es válido. Selecciona uno de la lista de autocompletado.`);
            }
        }
        if (pcSpecs.gpu) {
            const validGpu = await Gpu.findOne({ name: pcSpecs.gpu });
            if (!validGpu) {
                validationErrors.push(`GPU '${pcSpecs.gpu}' no es válida. Selecciona una de la lista de autocompletado.`);
            }
        }
        if (pcSpecs.ram) {
            const validRam = await Ram.findOne({ name: pcSpecs.ram });
            if (!validRam) {
                validationErrors.push(`RAM '${pcSpecs.ram}' no es válida. Selecciona una de la lista de autocompletado.`);
            }
        }

        if (validationErrors.length > 0) {
            const err = new Error('Errores de validación en las specs');
            err.status = 400;
            err.errors = validationErrors;
            throw err;
        }

        if (!pcSpecs.cpu && !pcSpecs.gpu && !pcSpecs.ram && !pcSpecs.os) {
            const err = new Error('Debes proporcionar al menos una spec (CPU, GPU, RAM u OS)');
            err.status = 400;
            throw err;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { pcSpecs },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            const err = new Error('Error al actualizar las specs');
            err.status = 500;
            throw err;
        }

        // Invalidar caché de análisis
        try {
            const mongoose = require('mongoose');
            const AnalysisCacheSchema = new mongoose.Schema({
                userId: String,
                gameId: Number,
                gameName: String,
                userSpecs: Object,
                analysis: Object,
                createdAt: Date
            });
            const AnalysisCache = mongoose.models.AnalysisCache || 
                                  mongoose.model('AnalysisCache', AnalysisCacheSchema);
            await AnalysisCache.deleteMany({ userId: userId.toString() });
        } catch (cacheError) {
            console.error('⚠️ Error invalidando caché:', cacheError.message);
        }

        res.json({
            success: true,
            message: 'Specs actualizadas correctamente',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                pcSpecs: updatedUser.pcSpecs
            }
        });

    } catch (error) {
        if (error.errors) {
            return res.status(error.status || 400).json({
                success: false,
                message: error.message,
                errors: error.errors
            });
        }
        next(error);
    }
};

// @desc    Cerrar sesión en el dispositivo actual
exports.logout = async (req, res, next) => {
    try {
        await Session.findOneAndDelete({ token: req.user.token });

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente en este dispositivo'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cerrar sesión en TODOS los dispositivos
exports.logoutAll = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await Session.deleteMany({ userId });

        res.json({
            success: true,
            message: 'Se han cerrado todas las sesiones activas'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cambiar contraseña e invalidar sesiones
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            const err = new Error('La contraseña actual es incorrecta');
            err.status = 401;
            throw err;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // REQUISITO: Invalidar todas las sesiones al cambiar contraseña
        await Session.deleteMany({ userId: user._id });

        res.json({
            success: true,
            message: 'Contraseña actualizada. Se han invalidado todas las sesiones por seguridad.'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            const resetToken = crypto.randomBytes(20).toString('hex');
            
            user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
            
            await user.save();
            
            // Console log to simulate sending email
            console.log(`[Email Simulation] Reset token for ${email}: ${resetToken}`);
        }

        // Return same message always to prevent enumeration
        res.status(200).json({
            success: true,
            message: 'Si el correo está registrado, recibirás un enlace'
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Restablecer contraseña
exports.resetPassword = async (req, res, next) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            const err = new Error('Token inválido o expirado');
            err.status = 400;
            throw err;
        }

        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        // Invalidate token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        // Invalidate sessions
        await Session.deleteMany({ userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        next(error);
    }
};