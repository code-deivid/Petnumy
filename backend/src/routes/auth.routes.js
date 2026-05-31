//  Rutas del módulo de autenticación
//
//  Públicas (sin token):
//    POST   /api/auth/registro   → crear cuenta
//    POST   /api/auth/login      → iniciar sesión
//    POST   /api/auth/refresh    → renovar token
//
//  Protegidas (requieren Bearer token):
//    POST   /api/auth/logout     → cerrar sesión
//    GET    /api/auth/me         → obtener perfil propio
//    PATCH  /api/auth/me         → actualizar perfil propio
// ============================================================

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  registro,
  login,
  logout,
  refresh,
  me,
  actualizarPerfil
} from '../controllers/auth.controller.js'

const router = Router()

// Rutas públicas
router.post('/registro', registro)
router.post('/login',    login)
router.post('/refresh',  refresh)

// Rutas protegidas
router.post('/logout',   requireAuth, logout)
router.get('/me',        requireAuth, me)
router.patch('/me',      requireAuth, actualizarPerfil)

export default router
