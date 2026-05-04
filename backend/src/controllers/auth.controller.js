// src/controllers/auth.controller.js
// ============================================================
//  Controlador de autenticación.
//
//  Supabase Auth gestiona internamente las contraseñas y tokens.
//  El backend actúa como intermediario para:
//    1. Llamar a Supabase Auth
//    2. Crear/actualizar el perfil en public.usuario
//    3. Devolver una respuesta limpia y consistente al frontend
// ============================================================

import { supabase, supabaseAdmin } from '../config/supabase.js'

// ------------------------------------------------------------
//  POST /api/auth/registro
//  Crea una cuenta nueva en Supabase Auth y su perfil de usuario
// ------------------------------------------------------------
export async function registro(req, res) {
  const { email, password, nombre, apellidos } = req.body

  // Validación básica de campos
  if (!email || !password || !nombre) {
    return res.status(400).json({
      error: 'Campos requeridos',
      message: 'Email, contraseña y nombre son obligatorios'
    })
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Contraseña débil',
      message: 'La contraseña debe tener al menos 6 caracteres'
    })
  }

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })

  if (authError) {
    return res.status(400).json({
      error: 'Error en el registro',
      message: authError.message
    })
  }

  const userId = authData.user?.id

  if (!userId) {
    return res.status(500).json({
      error: 'Error interno',
      message: 'No se pudo obtener el ID del usuario creado'
    })
  }

  // 2. Crear perfil en public.usuario usando supabaseAdmin
  //    (bypasea RLS porque el usuario aún no tiene sesión activa)
  const { error: profileError } = await supabaseAdmin
    .from('usuario')
    .insert({
      id: userId,
      nombre,
      apellidos: apellidos || null
    })

  if (profileError) {
    // Si falla la creación del perfil, intentamos limpiar el usuario de Auth
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return res.status(500).json({
      error: 'Error creando perfil',
      message: profileError.message
    })
  }

  return res.status(201).json({
    message: 'Cuenta creada correctamente. Revisa tu email para confirmarla.',
    usuario: {
      id: userId,
      email: authData.user.email,
      nombre,
      apellidos: apellidos || null
    }
  })
}

// ------------------------------------------------------------
//  POST /api/auth/login
//  Inicia sesión y devuelve los tokens de acceso
// ------------------------------------------------------------
export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      error: 'Campos requeridos',
      message: 'Email y contraseña son obligatorios'
    })
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return res.status(401).json({
      error: 'Credenciales incorrectas',
      message: error.message
    })
  }

  // Obtener el perfil del usuario de public.usuario
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('usuario')
    .select('id, nombre, apellidos, foto')
    .eq('id', data.user.id)
    .single()

  if (perfilError) {
    return res.status(500).json({
      error: 'Error obteniendo perfil',
      message: perfilError.message
    })
  }

  return res.status(200).json({
    message: 'Login correcto',
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    },
    usuario: {
      id: perfil.id,
      email: data.user.email,
      nombre: perfil.nombre,
      apellidos: perfil.apellidos,
      foto: perfil.foto
    }
  })
}

// ------------------------------------------------------------
//  POST /api/auth/logout
//  Cierra la sesión activa (requiere token válido)
// ------------------------------------------------------------
export async function logout(req, res) {
  const token = req.headers.authorization?.split(' ')[1]

  // Creamos un cliente temporal con el token del usuario
  // para cerrar su sesión específica
  const { error } = await supabase.auth.admin
    ? await supabaseAdmin.auth.admin.signOut(token)
    : await supabase.auth.signOut()

  if (error) {
    return res.status(500).json({
      error: 'Error cerrando sesión',
      message: error.message
    })
  }

  return res.status(200).json({ message: 'Sesión cerrada correctamente' })
}

// ------------------------------------------------------------
//  POST /api/auth/refresh
//  Renueva el access_token usando el refresh_token
// ------------------------------------------------------------
export async function refresh(req, res) {
  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({
      error: 'Campos requeridos',
      message: 'refresh_token es obligatorio'
    })
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token })

  if (error) {
    return res.status(401).json({
      error: 'No se pudo renovar la sesión',
      message: error.message
    })
  }

  return res.status(200).json({
    message: 'Sesión renovada',
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    }
  })
}

// ------------------------------------------------------------
//  GET /api/auth/me
//  Devuelve el perfil del usuario autenticado (requiere token)
// ------------------------------------------------------------
export async function me(req, res) {
  // req.user viene del middleware requireAuth
  const userId = req.user.id

  const { data: perfil, error } = await supabaseAdmin
    .from('usuario')
    .select('id, nombre, apellidos, foto, created_at')
    .eq('id', userId)
    .single()

  if (error) {
    return res.status(404).json({
      error: 'Perfil no encontrado',
      message: error.message
    })
  }

  return res.status(200).json({
    usuario: {
      id: perfil.id,
      email: req.user.email,
      nombre: perfil.nombre,
      apellidos: perfil.apellidos,
      foto: perfil.foto,
      created_at: perfil.created_at
    }
  })
}

// ------------------------------------------------------------
//  PATCH /api/auth/me
//  Actualiza el perfil del usuario autenticado
// ------------------------------------------------------------
export async function actualizarPerfil(req, res) {
  const userId = req.user.id
  const { nombre, apellidos, foto } = req.body

  // Solo permitimos actualizar estos campos
  const cambios = {}
  if (nombre    !== undefined) cambios.nombre    = nombre
  if (apellidos !== undefined) cambios.apellidos = apellidos
  if (foto      !== undefined) cambios.foto      = foto

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({
      error: 'Sin cambios',
      message: 'No se ha proporcionado ningún campo para actualizar'
    })
  }

  const { data, error } = await supabaseAdmin
    .from('usuario')
    .update(cambios)
    .eq('id', userId)
    .select('id, nombre, apellidos, foto')
    .single()

  if (error) {
    return res.status(500).json({
      error: 'Error actualizando perfil',
      message: error.message
    })
  }

  return res.status(200).json({
    message: 'Perfil actualizado correctamente',
    usuario: data
  })
}
