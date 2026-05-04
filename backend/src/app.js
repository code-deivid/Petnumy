// src/app.js
// ============================================================
//  Punto de entrada del backend de Petnumy
// ============================================================

import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'

import authRoutes         from './routes/auth.routes.js'
import mascotasRoutes     from './routes/mascotas.routes.js'
import vacunasRoutes      from './routes/vacunas.routes.js'
import clinicasRoutes     from './routes/clinicas.routes.js'
import veterinariosRoutes from './routes/veterinarios.routes.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middlewares globales ─────────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Ruta de salud (health check) ─────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    project: 'Petnumy API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// ── Rutas de la API ──────────────────────────────────────────

app.use('/api/auth',          authRoutes)
app.use('/api/mascotas',      mascotasRoutes)
app.use('/api/vacunas',       vacunasRoutes)
app.use('/api/clinicas',      clinicasRoutes)
app.use('/api/veterinarios',  veterinariosRoutes)

// Aquí irán los demás módulos cuando los desarrollemos:
// app.use('/api/citas',      citasRoutes)
// app.use('/api/clinicas',   clinicasRoutes)
// app.use('/api/vacunas',    vacunasRoutes)
// app.use('/api/citas',      citasRoutes)

// ── Manejadores de error (siempre al final) ──────────────────

app.use(notFound)
app.use(errorHandler)

// ── Arranque del servidor ────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🐾 Petnumy API corriendo en http://localhost:${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/health\n`)
})

export default app
