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

// Actualizar specs de PC del usuario
// Actualizar specs de PC del usuario (PROTEGIDO Y MEJORADO)
exports.updateSpecs = async (req, res, next) => {
    try {
        const { pcSpecs } = req.body;
        const userId = req.user.id; // Viene del middleware authMiddleware

        // Validación: pcSpecs es requerido
        if (!pcSpecs || typeof pcSpecs !== 'object') {
            const err = new Error('Se requiere un objeto pcSpecs válido');
            err.status = 400;
            throw err;
        }

        // Verificar que el usuario existe (seguridad extra)
        const userExists = await User.findById(userId);
        if (!userExists) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }

        // VALIDACIÓN DE HARDWARE con autocompletado (solo acepta valores válidos de la BD)
        const validationErrors = [];

        // Validar CPU (si se envía)
        if (pcSpecs.cpu) {
            const validCpu = await Cpu.findOne({ name: pcSpecs.cpu });
            if (!validCpu) {
                validationErrors.push(`CPU '${pcSpecs.cpu}' no es válido. Selecciona uno de la lista de autocompletado.`);
            }
        }

        // Validar GPU (si se envía)
        if (pcSpecs.gpu) {
            const validGpu = await Gpu.findOne({ name: pcSpecs.gpu });
            if (!validGpu) {
                validationErrors.push(`GPU '${pcSpecs.gpu}' no es válida. Selecciona una de la lista de autocompletado.`);
            }
        }

        // Validar RAM (si se envía)
        if (pcSpecs.ram) {
            const validRam = await Ram.findOne({ name: pcSpecs.ram });
            if (!validRam) {
                validationErrors.push(`RAM '${pcSpecs.ram}' no es válida. Selecciona una de la lista de autocompletado.`);
            }
        }

        // Si hay errores de validación, lanzar error
        if (validationErrors.length > 0) {
            const err = new Error('Errores de validación en las specs');
            err.status = 400;
            err.errors = validationErrors;
            throw err;
        }

        // Al menos un campo debe estar presente
        if (!pcSpecs.cpu && !pcSpecs.gpu && !pcSpecs.ram && !pcSpecs.os) {
            const err = new Error('Debes proporcionar al menos una spec (CPU, GPU, RAM u OS)');
            err.status = 400;
            throw err;
        }

        // Actualizar specs del usuario (SOLO SU PROPIA CUENTA)
        const updatedUser = await User.findByIdAndUpdate(
            userId, // Solo puede actualizar su propia cuenta
            { pcSpecs },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            const err = new Error('Error al actualizar las specs');
            err.status = 500;
            throw err;
        }

        // INVALIDAR CACHÉ de análisis en catalog-service
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
            
            const deleteResult = await AnalysisCache.deleteMany({ userId: userId.toString() });
            console.log(`🗑️ Caché invalidado: ${deleteResult.deletedCount} análisis eliminados para usuario ${updatedUser.username}`);
        } catch (cacheError) {
            // No detener el proceso si falla el caché, solo logear
            console.error('⚠️ Error invalidando caché (no crítico):', cacheError.message);
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
        // Manejo de errores específicos
        if (error.errors) {
            // Errores de validación custom
            return res.status(error.status || 400).json({
                success: false,
                message: error.message,
                errors: error.errors
            });
        }
        
        // Otros errores
        next(error);
    }
};