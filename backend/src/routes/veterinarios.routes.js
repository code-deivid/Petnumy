// src/routes/veterinarios.routes.js
// ============================================================
//  Rutas del módulo de veterinarios — solo lectura
//  Todas protegidas con requireAuth
//
//  GET  /api/veterinarios/:id   → detalle de un veterinario
// ============================================================

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getVeterinarioById } from '../controllers/clinicas.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/:id', getVeterinarioById)

export default router
