const Review = require('../models/Review');

// OBTENER RESEÑAS (+ PROMEDIOS)
exports.getGameReviews = async (req, res, next) => {
    const { gameId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!gameId) return res.status(400).json({ success: false, msg: 'Falta gameId' });

    try {
        const parsedGameId = parseInt(gameId);

        const result = await Review.aggregate([
            { $match: { gameId: parsedGameId } },
            {
                $facet: {
                    stats: [
                        {
                            $group: {
                                _id: "$type",
                                average: { $avg: "$rating" },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    reviews: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        { 
                            $project: { 
                                _id: 1, 
                                username: 1, 
                                type: 1, 
                                rating: 1, 
                                comment: 1, 
                                createdAt: 1,
                                userId: 1 // Devuelvo el ID del usuario para que el front sepa si puede editar/borrar
                            } 
                        }
                    ]
                }
            }
        ]);

        const stats = {
            artistic: { average: 0, count: 0 },
            technical: { average: 0, count: 0 }
        };

        if (result[0].stats.length > 0) {
            result[0].stats.forEach(s => {
                if (stats[s._id]) {
                    stats[s._id].average = parseFloat(s.average.toFixed(1));
                    stats[s._id].count = s.count;
                }
            });
        }

        res.json({
            success: true,
            data: {
                stats,
                reviews: result[0].reviews,
                pagination: {
                    page,
                    limit,
                    hasMore: result[0].reviews.length === limit
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

// CREAR O ACTUALIZAR (UPSERT)
exports.upsertReview = async (req, res, next) => {
    try {
        const { gameId, type, rating, comment } = req.body;
        
        // Obtenemos specs del token (Snapshot actual)
        const { id: userId, username, pcSpecs } = req.user;

        if (!username) {
             return res.status(401).json({ success: false, msg: 'Token antiguo, haz login de nuevo.' });
        }
        if (![1, 2, 3, 4, 5].includes(Number(rating))) {
            return res.status(400).json({ success: false, msg: 'La puntuación debe ser entre 1 y 5' });
        }

        const review = await Review.findOneAndUpdate(
            { gameId, userId, type }, 
            { 
                rating, 
                comment, 
                username,
                pcSpecs: pcSpecs || {}, // <--- GUARDADO HISTÓRICO
                updatedAt: new Date()
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, data: review, msg: 'Reseña guardada correctamente' });

    } catch (error) {
        next(error);
    }
};

// ELIMINAR (SOLO PROPIETARIO O ADMIN)
exports.deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params; // ID de la Reseña (_id)
        const requestingUserId = req.user.id;
        const userRole = req.user.role;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ success: false, msg: 'Reseña no encontrada' });
        }

        // Permisos: Dueño o Admin
        if (review.userId !== requestingUserId && userRole !== 'admin') {
            return res.status(403).json({ success: false, msg: 'No tienes permisos para eliminar esta reseña' });
        }

        await review.deleteOne();

        res.json({ success: true, msg: 'Reseña eliminada correctamente' });

    } catch (error) {
        next(error);
    }
};