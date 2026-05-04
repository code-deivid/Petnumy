// src/routes/mascotas.routes.js
// ============================================================
//  Rutas del módulo de mascotas
//  Todas protegidas con requireAuth — ninguna es pública
//
//  GET    /api/mascotas        → listar mis mascotas
//  GET    /api/mascotas/:id    → obtener una mascota
//  POST   /api/mascotas        → crear mascota
//  PATCH  /api/mascotas/:id    → actualizar mascota
//  DELETE /api/mascotas/:id    → eliminar mascota
// ============================================================

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  getMascotas,
  getMascotaById,
  createMascota,
  updateMascota,
  deleteMascota
} from '../controllers/mascotas.controller.js'
import {
  getVacunasMascota,
  addVacunaMascota,
  updateVacunaMascota,
  deleteVacunaMascota
} from '../controllers/vacunas.controller.js'

const router = Router()

// Aplicamos requireAuth a todas las rutas de este módulo
router.use(requireAuth)

// ── CRUD mascotas ────────────────────────────────────────────
router.get('/',      getMascotas)
router.get('/:id',   getMascotaById)
router.post('/',     createMascota)
router.patch('/:id', updateMascota)
router.delete('/:id',deleteMascota)

// ── Vacunas de una mascota (rutas anidadas) ──────────────────
router.get   ('/:id/vacunas',                     getVacunasMascota)
router.post  ('/:id/vacunas',                     addVacunaMascota)
router.patch ('/:id/vacunas/:vacunaMascotaId',    updateVacunaMascota)
router.delete('/:id/vacunas/:vacunaMascotaId',    deleteVacunaMascota)

export default router
