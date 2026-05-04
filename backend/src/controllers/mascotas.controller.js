// src/controllers/mascotas.controller.js
// ============================================================
//  Módulo de mascotas — CRUD completo
//
//  Seguridad: todas las queries incluyen el filtro user_id = req.user.id
//  Esto garantiza que un usuario nunca accede a mascotas ajenas,
//  como segunda capa de seguridad además del RLS de Supabase.
// ============================================================

import { supabaseAdmin } from '../config/supabase.js'

// ── Campos permitidos en SELECT ──────────────────────────────
const SELECT_FIELDS = `
  id,
  nombre,
  foto,
  nacimiento,
  genero,
  peso,
  microchip,
  created_at,
  id_raza,
  raza (
    id,
    nombre,
    especie (
      id,
      especie
    )
  )
`.trim()

// ── Campos permitidos en PATCH (lista blanca) ────────────────
const CAMPOS_EDITABLES = ['nombre', 'foto', 'nacimiento', 'genero', 'peso', 'microchip', 'id_raza']

// ── Validaciones ─────────────────────────────────────────────

/**
 * Valida los campos de una mascota.
 * @param {object} body - Cuerpo de la petición
 * @param {boolean} esCreacion - Si es true, valida campos obligatorios
 * @returns {{ valido: boolean, errores: string[] }}
 */
function validarMascota(body, esCreacion = false) {
  const errores = []

  if (esCreacion) {
    if (!body.nombre || typeof body.nombre !== 'string' || !body.nombre.trim()) {
      errores.push('El campo "nombre" es obligatorio')
    }
    if (!body.id_raza) {
      errores.push('El campo "id_raza" es obligatorio')
    }
  }

  if (body.nombre !== undefined && (!body.nombre || !body.nombre.trim())) {
    errores.push('"nombre" no puede estar vacío')
  }

  if (body.genero !== undefined && !['macho', 'hembra'].includes(body.genero)) {
    errores.push('"genero" debe ser "macho" o "hembra"')
  }

  if (body.peso !== undefined && body.peso !== null) {
    const peso = Number(body.peso)
    if (isNaN(peso) || peso < 0) {
      errores.push('"peso" debe ser un número mayor o igual a 0')
    }
  }

  if (body.nacimiento !== undefined && body.nacimiento !== null) {
    const fecha = new Date(body.nacimiento)
    if (isNaN(fecha.getTime())) {
      errores.push('"nacimiento" debe ser una fecha válida en formato YYYY-MM-DD')
    }
    if (fecha > new Date()) {
      errores.push('"nacimiento" no puede ser una fecha futura')
    }
  }

  return { valido: errores.length === 0, errores }
}

// ── Controladores ─────────────────────────────────────────────

// ------------------------------------------------------------
//  GET /api/mascotas
//  Devuelve todas las mascotas del usuario autenticado
// ------------------------------------------------------------
export async function getMascotas(req, res) {
  const userId = req.user.id

  const { data, error } = await supabaseAdmin
    .from('mascota')
    .select(SELECT_FIELDS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({
      error: 'Error obteniendo mascotas',
      message: error.message
    })
  }

  return res.status(200).json({
    total: data.length,
    mascotas: data
  })
}

// ------------------------------------------------------------
//  GET /api/mascotas/:id
//  Devuelve una mascota por ID, solo si pertenece al usuario
// ------------------------------------------------------------
export async function getMascotaById(req, res) {
  const userId    = req.user.id
  const mascotaId = req.params.id

  const { data, error } = await supabaseAdmin
    .from('mascota')
    .select(SELECT_FIELDS)
    .eq('id', mascotaId)
    .eq('user_id', userId)   // seguridad: solo la tuya
    .single()

  if (error) {
    // Supabase devuelve error con code PGRST116 si no encuentra fila
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'No encontrada',
        message: 'La mascota no existe o no te pertenece'
      })
    }
    return res.status(500).json({
      error: 'Error obteniendo mascota',
      message: error.message
    })
  }

  return res.status(200).json({ mascota: data })
}

// ------------------------------------------------------------
//  POST /api/mascotas
//  Crea una nueva mascota para el usuario autenticado
// ------------------------------------------------------------
export async function createMascota(req, res) {
  const userId = req.user.id
  const { nombre, id_raza, nacimiento, genero, peso, microchip, foto } = req.body

  // Validación
  const { valido, errores } = validarMascota(req.body, true)
  if (!valido) {
    return res.status(400).json({
      error: 'Datos inválidos',
      errores
    })
  }

  // Verificar que la raza existe
  const { data: raza, error: razaError } = await supabaseAdmin
    .from('raza')
    .select('id')
    .eq('id', id_raza)
    .single()

  if (razaError || !raza) {
    return res.status(400).json({
      error: 'Raza no válida',
      message: 'El id_raza proporcionado no existe'
    })
  }

  // Insertar mascota
  const { data, error } = await supabaseAdmin
    .from('mascota')
    .insert({
      user_id:    userId,
      nombre:     nombre.trim(),
      id_raza,
      nacimiento: nacimiento  || null,
      genero:     genero      || null,
      peso:       peso        ?? null,
      microchip:  microchip   || null,
      foto:       foto        || null
    })
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    // Microchip duplicado
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Microchip duplicado',
        message: 'Ya existe una mascota registrada con ese número de microchip'
      })
    }
    return res.status(500).json({
      error: 'Error creando mascota',
      message: error.message
    })
  }

  return res.status(201).json({
    message: 'Mascota creada correctamente',
    mascota: data
  })
}

// ------------------------------------------------------------
//  PATCH /api/mascotas/:id
//  Actualiza los campos enviados de una mascota propia
// ------------------------------------------------------------
export async function updateMascota(req, res) {
  const userId    = req.user.id
  const mascotaId = req.params.id

  // Filtrar solo los campos editables que vienen en el body
  const cambios = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (req.body[campo] !== undefined) {
      cambios[campo] = req.body[campo]
    }
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({
      error: 'Sin cambios',
      message: 'No se ha proporcionado ningún campo válido para actualizar'
    })
  }

  // Validar los campos que se van a actualizar
  const { valido, errores } = validarMascota(cambios, false)
  if (!valido) {
    return res.status(400).json({
      error: 'Datos inválidos',
      errores
    })
  }

  // Limpiar nombre si viene
  if (cambios.nombre) cambios.nombre = cambios.nombre.trim()

  const { data, error } = await supabaseAdmin
    .from('mascota')
    .update(cambios)
    .eq('id', mascotaId)
    .eq('user_id', userId)   // seguridad: solo la tuya
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'No encontrada',
        message: 'La mascota no existe o no te pertenece'
      })
    }
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Microchip duplicado',
        message: 'Ya existe una mascota registrada con ese número de microchip'
      })
    }
    return res.status(500).json({
      error: 'Error actualizando mascota',
      message: error.message
    })
  }

  return res.status(200).json({
    message: 'Mascota actualizada correctamente',
    mascota: data
  })
}

// ------------------------------------------------------------
//  DELETE /api/mascotas/:id
//  Elimina una mascota propia (comprueba que existe antes)
// ------------------------------------------------------------
export async function deleteMascota(req, res) {
  const userId    = req.user.id
  const mascotaId = req.params.id

  // Primero verificamos que la mascota existe y es del usuario
  const { data: mascota, error: findError } = await supabaseAdmin
    .from('mascota')
    .select('id, nombre')
    .eq('id', mascotaId)
    .eq('user_id', userId)
    .single()

  if (findError || !mascota) {
    return res.status(404).json({
      error: 'No encontrada',
      message: 'La mascota no existe o no te pertenece'
    })
  }

  const { error } = await supabaseAdmin
    .from('mascota')
    .delete()
    .eq('id', mascotaId)
    .eq('user_id', userId)

  if (error) {
    return res.status(500).json({
      error: 'Error eliminando mascota',
      message: error.message
    })
  }

  return res.status(200).json({
    message: `Mascota "${mascota.nombre}" eliminada correctamente`
  })
}
