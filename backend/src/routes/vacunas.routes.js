//  Rutas del módulo de vacunas
//  Todas protegidas con requireAuth
//
//  Catálogo global:
//    GET    /api/vacunas                                  → catálogo (filtrable por ?id_especie=)
//
//  Vacunas de una mascota (montadas en mascotas.routes.js):
//    GET    /api/mascotas/:id/vacunas                     → listar
//    POST   /api/mascotas/:id/vacunas                     → añadir
//    PATCH  /api/mascotas/:id/vacunas/:vacunaMascotaId    → actualizar
//    DELETE /api/mascotas/:id/vacunas/:vacunaMascotaId    → eliminar
// ============================================================

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getCatalogoVacunas } from '../controllers/vacunas.controller.js'

const router = Router()

router.use(requireAuth)

// Solo el catálogo vive aquí; el resto se monta desde mascotas.routes.js
router.get('/', getCatalogoVacunas)

export default router
