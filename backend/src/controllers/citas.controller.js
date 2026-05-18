// src/controllers/citas.controller.js
// ============================================================
//  Módulo de citas — MVP
//  El usuario puede: listar sus citas, crear una nueva y cancelar.
//  La cita siempre se crea como "pendiente".
//  Confirmación/completado lo gestiona el admin desde Supabase.
// ============================================================

import { supabaseAdmin } from '../config/supabase.js'

// Campos que devuelve cada cita al frontend
const SELECT_CITA = `
  id,
  fecha_hora,
  estado,
  notas_usuario,
  created_at,
  mascota  ( id, nombre ),
  veterinario ( id, nombre, apellidos, especialidad,
    clinica ( id, nombre, ciudad )
  ),
  servicio ( id, nombre, duracion_minutos, precio )
`.trim()

// ── Validaciones ──────────────────────────────────────────────

function validarCita(body) {
  const errores = []

  if (!body.id_mascota)     errores.push('"id_mascota" es obligatorio')
  if (!body.id_veterinario) errores.push('"id_veterinario" es obligatorio')
  if (!body.id_servicio)    errores.push('"id_servicio" es obligatorio')

  if (!body.fecha_hora) {
    errores.push('"fecha_hora" es obligatorio')
  } else {
    const fecha = new Date(body.fecha_hora)
    if (isNaN(fecha.getTime())) {
      errores.push('"fecha_hora" no es una fecha válida')
    } else if (fecha <= new Date()) {
      errores.push('"fecha_hora" debe ser una fecha futura')
    }
  }

  return errores
}

// ── Controladores ──────────────────────────────────────────────

// ------------------------------------------------------------
//  GET /api/citas
//  Lista todas las citas del usuario autenticado
// ------------------------------------------------------------
export async function getCitas(req, res) {
  const userId = req.user.id

  const { data, error } = await supabaseAdmin
    .from('cita')
    .select(SELECT_CITA)
    .eq('id_usuario', userId)
    .order('fecha_hora', { ascending: false })

  if (error) {
    return res.status(500).json({
      error: 'Error obteniendo citas',
      message: error.message
    })
  }

  return res.status(200).json({
    total: data.length,
    citas: data
  })
}

// ------------------------------------------------------------
//  POST /api/citas
//  Crea una nueva cita para el usuario autenticado
//  Siempre se crea con estado "pendiente"
// ------------------------------------------------------------
export async function createCita(req, res) {
  const userId = req.user.id
  const { id_mascota, id_veterinario, id_servicio, fecha_hora, notas_usuario } = req.body

  // 1. Validar campos
  const errores = validarCita(req.body)
  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos', errores })
  }

  // 2. Verificar que la mascota pertenece al usuario
  const { data: mascota, error: mascotaError } = await supabaseAdmin
    .from('mascota')
    .select('id, nombre')
    .eq('id', id_mascota)
    .eq('user_id', userId)
    .single()

  if (mascotaError || !mascota) {
    return res.status(400).json({
      error: 'Mascota no válida',
      message: 'La mascota no existe o no te pertenece'
    })
  }

  // 3. Verificar que el veterinario existe y está activo
  const { data: vet, error: vetError } = await supabaseAdmin
    .from('veterinario')
    .select('id, nombre')
    .eq('id', id_veterinario)
    .eq('activo', true)
    .single()

  if (vetError || !vet) {
    return res.status(400).json({
      error: 'Veterinario no válido',
      message: 'El veterinario no existe o no está disponible'
    })
  }

  // 4. Verificar que el servicio existe y está activo
  const { data: servicio, error: servicioError } = await supabaseAdmin
    .from('servicio')
    .select('id, nombre')
    .eq('id', id_servicio)
    .eq('activo', true)
    .single()

  if (servicioError || !servicio) {
    return res.status(400).json({
      error: 'Servicio no válido',
      message: 'El servicio no existe o no está disponible'
    })
  }

  // 5. Crear la cita como pendiente
  const { data, error } = await supabaseAdmin
    .from('cita')
    .insert({
      id_usuario:    userId,
      id_mascota,
      id_veterinario,
      id_servicio,
      fecha_hora,
      estado:        'pendiente',
      notas_usuario: notas_usuario?.trim() || null
    })
    .select(SELECT_CITA)
    .single()

  if (error) {
    return res.status(500).json({
      error: 'Error creando cita',
      message: error.message
    })
  }

  return res.status(201).json({
    message: 'Cita creada correctamente. Está pendiente de confirmación.',
    cita: data
  })
}

// ------------------------------------------------------------
//  PATCH /api/citas/:id/cancelar
//  Cancela una cita propia si está en estado pendiente o confirmada
// ------------------------------------------------------------
export async function cancelarCita(req, res) {
  const userId = req.user.id
  const citaId = req.params.id

  // 1. Buscar la cita y verificar que pertenece al usuario
  const { data: cita, error: findError } = await supabaseAdmin
    .from('cita')
    .select('id, estado')
    .eq('id', citaId)
    .eq('id_usuario', userId)
    .single()

  if (findError || !cita) {
    return res.status(404).json({
      error: 'No encontrada',
      message: 'La cita no existe o no te pertenece'
    })
  }

  // 2. Verificar que se puede cancelar
  if (!['pendiente', 'confirmada'].includes(cita.estado)) {
    return res.status(409).json({
      error: 'No cancelable',
      message: `No se puede cancelar una cita en estado "${cita.estado}"`
    })
  }

  // 3. Actualizar estado
  const { data, error } = await supabaseAdmin
    .from('cita')
    .update({ estado: 'cancelada' })
    .eq('id', citaId)
    .select(SELECT_CITA)
    .single()

  if (error) {
    return res.status(500).json({
      error: 'Error cancelando cita',
      message: error.message
    })
  }

  return res.status(200).json({
    message: 'Cita cancelada correctamente',
    cita: data
  })
}
