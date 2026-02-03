const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// RUTAS PÚBLICAS
// GET /api/reviews/72 (Obtener reseñas de un juego)
router.get('/:gameId', reviewController.getGameReviews);

// RUTAS PROTEGIDAS
// POST /api/reviews (Crear o Editar reseña)
router.post('/', authMiddleware, reviewController.upsertReview);

// DELETE /api/reviews/65b2a... (Borrar reseña por su _id)
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;