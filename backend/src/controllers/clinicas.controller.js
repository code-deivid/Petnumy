// src/controllers/clinicas.controller.js
// ============================================================
//  Clínicas veterinarias — con geolocalización, filtros y ordenación
// ============================================================

import { supabaseAdmin } from '../config/supabase.js'

// Campos completos para listado
const SELECT_CLINICA = `
  id, nombre, direccion, codigo_postal, ciudad,
  latitud, longitud, valoracion, abierto_24h,
  telefono, imagen, descripcion, servicios, activa
`.trim()

// ------------------------------------------------------------
//  GET /api/clinicas
//  Filtros: ?ciudad= ?servicio= ?abierto_24h=true ?q=
// ------------------------------------------------------------
export async function getClinicas(req, res) {
  const { ciudad, servicio, abierto_24h, q } = req.query

  let query = supabaseAdmin
    .from('clinica')
    .select(SELECT_CLINICA)
    .eq('activa', true)
    .order('valoracion', { ascending: false })

  if (ciudad?.trim()) {
    query = query.or(`ciudad.ilike.%${ciudad.trim()}%,codigo_postal.eq.${ciudad.trim()}`)
  }
  if (abierto_24h === 'true') {
    query = query.eq('abierto_24h', true)
  }
  if (servicio?.trim()) {
    query = query.contains('servicios', [servicio.trim()])
  }
  if (q?.trim()) {
    query = query.or(`nombre.ilike.%${q.trim()}%,direccion.ilike.%${q.trim()}%,ciudad.ilike.%${q.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: 'Error obteniendo clínicas', message: error.message })
  }

  return res.status(200).json({ total: data.length, clinicas: data })
}

// ------------------------------------------------------------
//  GET /api/clinicas/:id
// ------------------------------------------------------------
export async function getClinicaById(req, res) {
  const { id } = req.params

  const { data, error } = await supabaseAdmin
    .from('clinica')
    .select(SELECT_CLINICA)
    .eq('id', id)
    .eq('activa', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'No encontrada', message: 'La clínica no existe' })
    }
    return res.status(500).json({ error: 'Error obteniendo clínica', message: error.message })
  }

  return res.status(200).json({ clinica: data })
}

// ------------------------------------------------------------
//  GET /api/clinicas/:id/veterinarios
// ------------------------------------------------------------
export async function getVeterinariosByClinica(req, res) {
  const { id } = req.params

  const { data: clinica, error: clinicaError } = await supabaseAdmin
    .from('clinica').select('id, nombre').eq('id', id).eq('activa', true).single()

  if (clinicaError || !clinica) {
    return res.status(404).json({ error: 'No encontrada', message: 'La clínica no existe' })
  }

  const { data, error } = await supabaseAdmin
    .from('veterinario')
    .select('id, nombre, apellidos, especialidad, foto')
    .eq('id_clinica', id)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Error obteniendo veterinarios', message: error.message })
  }

  return res.status(200).json({
    clinica: { id: clinica.id, nombre: clinica.nombre },
    total: data.length,
    veterinarios: data
  })
}

// ------------------------------------------------------------
//  GET /api/veterinarios/:id
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
      return res.status(404).json({ error: 'No encontrado', message: 'El veterinario no existe' })
    }
    return res.status(500).json({ error: 'Error obteniendo veterinario', message: error.message })
  }

  return res.status(200).json({ veterinario: data })
}
