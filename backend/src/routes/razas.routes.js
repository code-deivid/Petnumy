//  Rutas del módulo de razas — solo lectura
//
//  GET /api/razas               → todas las razas
//  GET /api/razas?id_especie=   → filtradas por especie
// ============================================================

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getRazas } from '../controllers/razas.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', getRazas)

export default router
