// src/middleware/error.middleware.js
// ============================================================
//  Manejador de errores centralizado.
//  Se registra al final de todos los middlewares en app.js.
//  Captura cualquier error que se pase con next(error).
// ============================================================

export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err)

  const status  = err.status  || err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  res.status(status).json({
    error: err.name || 'Error',
    message
  })
}

// ============================================================
//  Manejador para rutas no encontradas (404)
// ============================================================
export function notFound(req, res) {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `No existe el endpoint ${req.method} ${req.path}`
  })
}
