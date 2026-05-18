// src/routes/citas.routes.js
// ============================================================
//  Rutas del módulo de citas — todas protegidas
//
//  GET   /api/citas             → listar citas del usuario
//  POST  /api/citas             → crear cita nueva
//  PATCH /api/citas/:id/cancelar → cancelar una cita propia
// ============================================================

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  getCitas,
  createCita,
  cancelarCita
} from '../controllers/citas.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/',                  getCitas)
router.post('/',                 createCita)
router.patch('/:id/cancelar',    cancelarCita)

export default router
