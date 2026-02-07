module.exports = (err, req, res, next) => {
    console.error(err); // Log completo para desarrolladores

    const status = err.status || 500;
    let msg = 'Error interno del servidor';

    // Si es error 4xx y tiene mensaje, muéstralo al usuario
    if (status >= 400 && status < 500 && err.message) {
        msg = err.message;
    }

    res.status(status).json({
        success: false,
        msg
    });
};