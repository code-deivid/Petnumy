// src/routes/clinicas.routes.js
// ============================================================
//  Rutas del módulo de clínicas — solo lectura
//  Todas protegidas con requireAuth
//
//  GET  /api/clinicas                        → listar (filtros: ?ciudad= &nombre=)
//  GET  /api/clinicas/:id                    → detalle de clínica
//  GET  /api/clinicas/:id/veterinarios       → vets de una clínica
// ============================================================

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  getClinicas,
  getClinicaById,
  getVeterinariosByClinica
} from '../controllers/clinicas.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',                     getClinicas)
router.get('/:id',                  getClinicaById)
router.get('/:id/veterinarios',     getVeterinariosByClinica)

export default router
