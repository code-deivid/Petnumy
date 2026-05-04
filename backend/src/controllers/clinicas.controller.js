// src/controllers/clinicas.controller.js
// ============================================================
//  Módulo de clínicas y veterinarios — solo lectura, enfoque MVP
//  Sin joins complejos, sin cálculos, sin reseñas.
// ============================================================

import { supabaseAdmin } from '../config/supabase.js'

// ------------------------------------------------------------
//  GET /api/clinicas
//  Lista clínicas activas. Filtro opcional: ?ciudad=
// ------------------------------------------------------------
export async function getClinicas(req, res) {
  const { ciudad } = req.query

  let query = supabaseAdmin
    .from('clinica')
    .select('id, nombre, ciudad')
    .eq('activa', true)
    .order('nombre', { ascending: true })

  if (ciudad?.trim()) {
    query = query.ilike('ciudad', `%${ciudad.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({
      error: 'Error obteniendo clínicas',
      message: error.message
    })
  }

  return res.status(200).json({
    total: data.length,
    clinicas: data
  })
}

// ------------------------------------------------------------
//  GET /api/clinicas/:id
//  Detalle básico de una clínica
// ------------------------------------------------------------
export async function getClinicaById(req, res) {
  const { id } = req.params

  const { data, error } = await supabaseAdmin
    .from('clinica')
    .select('id, nombre, ciudad, direccion, telefono, email, foto')
    .eq('id', id)
    .eq('activa', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'No encontrada',
        message: 'La clínica no existe o no está disponible'
      })
    }
    return res.status(500).json({
      error: 'Error obteniendo clínica',
      message: error.message
    })
  }

  return res.status(200).json({ clinica: data })
}

// ------------------------------------------------------------
//  GET /api/clinicas/:id/veterinarios
//  Lista los veterinarios activos de una clínica
// ------------------------------------------------------------
export async function getVeterinariosByClinica(req, res) {
  const { id } = req.params

  // Verificar que la clínica existe y está activa
  const { data: clinica, error: clinicaError } = await supabaseAdmin
    .from('clinica')
    .select('id, nombre')
    .eq('id', id)
    .eq('activa', true)
    .single()

  if (clinicaError || !clinica) {
    return res.status(404).json({
      error: 'No encontrada',
      message: 'La clínica no existe o no está disponible'
    })
  }

  const { data, error } = await supabaseAdmin
    .from('veterinario')
    .select('id, nombre, especialidad, id_clinica')
    .eq('id_clinica', id)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) {
    return res.status(500).json({
      error: 'Error obteniendo veterinarios',
      message: error.message
    })
  }

  return res.status(200).json({
    clinica: { id: clinica.id, nombre: clinica.nombre },
    total: data.length,
    veterinarios: data
  })
}

// ------------------------------------------------------------
//  GET /api/veterinarios/:id
//  Detalle básico de un veterinario
// ------------------------------------------------------------
export async function getVeterinarioById(req, res) {
  const { id } = req.params

  const { data, error } = await supabaseAdmin
    .from('veterinario')
    .select('id, nombre, apellidos, especialidad, id_clinica, foto')
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'El veterinario no existe o no está disponible'
      })
    }
    return res.status(500).json({
      error: 'Error obteniendo veterinario',
      message: error.message
    })
  }

  return res.status(200).json({ veterinario: data })
}
