// src/middleware/auth.middleware.js
// ============================================================
//  Verifica que la petición incluye un JWT válido de Supabase.
//
//  El frontend debe enviar en cada petición protegida:
//    Authorization: Bearer <access_token>
//
//  Si el token es válido, adjunta el usuario a req.user
//  para que los controladores puedan usarlo.
// ============================================================

import { supabase } from '../config/supabase.js'

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Se requiere token de autenticación'
    })
  }

  const token = authHeader.split(' ')[1]

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
      message: error?.message || 'Autenticación fallida'
    })
  }

  // Adjuntamos el usuario al request para uso en controladores
  req.user = data.user
  next()
}
