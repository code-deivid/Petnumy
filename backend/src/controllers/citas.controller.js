// src/controllers/citas.controller.js
// ============================================================
//  Módulo de citas — MVP
//  Dos tipos de cita:
//  1. Cita con veterinario: requiere id_veterinario + id_servicio
//  2. Cita directa: solo id_clinica + motivo (texto libre)
//
//  NOTA sobre embeds Supabase:
//  Solo se usan relaciones FK que EXISTEN en el schema.
//  La FK cita.id_clinica puede no estar registrada como
//  FK explícita en Supabase, por eso NO usamos embed directo
//  de clinica desde cita. En su lugar hacemos queries separadas
//  y combinamos los datos manualmente.
// ============================================================

import { supabaseAdmin } from '../config/supabase.js'

// ── SELECT seguro para citas con veterinario ──────────────────
// Solo embeds que sí tienen FK confirmada en el schema:
// cita → mascota (id_mascota)
// cita → veterinario (id_veterinario) → clinica (id_clinica del veterinario)
// cita → servicio (id_servicio)
const SELECT_CITA_VET = `
  id,
  fecha_hora,
  estado,
  motivo,
  notas_usuario,
  created_at,
  id_clinica,
  mascota  ( id, nombre ),
  veterinario ( id, nombre, apellidos, especialidad,
    clinica ( id, nombre, ciudad )
  ),
  servicio ( id, nombre )
`.trim()

// ── SELECT para citas directas (sin veterinario) ──────────────
// Solo campos de cita + mascota. La clínica se enriquece aparte.
const SELECT_CITA_BASE = `
  id,
  fecha_hora,
  estado,
  motivo,
  notas_usuario,
  created_at,
  id_clinica,
  mascota ( id, nombre )
`.trim()

// ── Helper: enriquecer lista con datos de clínica ─────────────
// Para citas directas (sin veterinario), busca la clínica por id_clinica.
async function enriquecerConClinica(citas) {
  // Recoger ids únicos de clínicas que no llegan ya por embed de veterinario
  const idsClinica = [...new Set(
    citas
      .filter(c => c.id_clinica && !c.veterinario)
      .map(c => c.id_clinica)
  )]

  if (idsClinica.length === 0) return citas

  const { data: clinicas } = await supabaseAdmin
    .from('clinica')
    .select('id, nombre, ciudad')
    .in('id', idsClinica)

  const mapaClinicas = {}
  if (clinicas) clinicas.forEach(cl => { mapaClinicas[cl.id] = cl })

  return citas.map(c => {
    if (c.id_clinica && !c.veterinario && mapaClinicas[c.id_clinica]) {
      return { ...c, clinica: mapaClinicas[c.id_clinica] }
    }
    return c
  })
}

// ── Controladores ──────────────────────────────────────────────

// ------------------------------------------------------------
//  GET /api/citas
//  Lista todas las citas del usuario autenticado.
//  Enriquece con clínica las citas directas (sin veterinario).
// ------------------------------------------------------------
export async function getCitas(req, res) {
  const userId = req.user.id

  // Intentar primero con embed veterinario completo
  const { data, error } = await supabaseAdmin
    .from('cita')
    .select(SELECT_CITA_VET)
    .eq('id_usuario', userId)
    .order('fecha_hora', { ascending: false })

  if (error) {
    // Si el embed de veterinario también falla, usar select base
    const { data: dataBase, error: errorBase } = await supabaseAdmin
      .from('cita')
      .select(SELECT_CITA_BASE)
      .eq('id_usuario', userId)
      .order('fecha_hora', { ascending: false })

    if (errorBase) {
      return res.status(500).json({ error: 'Error obteniendo citas', message: errorBase.message })
    }

    const citasEnriquecidas = await enriquecerConClinica(dataBase)
    return res.status(200).json({ total: citasEnriquecidas.length, citas: citasEnriquecidas })
  }

  const citasEnriquecidas = await enriquecerConClinica(data)
  return res.status(200).json({ total: citasEnriquecidas.length, citas: citasEnriquecidas })
}

// ------------------------------------------------------------
//  POST /api/citas
//  Cita con veterinario y servicio concreto.
// ------------------------------------------------------------
export async function createCita(req, res) {
  const userId = req.user.id
  const { id_mascota, id_veterinario, id_servicio, fecha_hora, notas_usuario } = req.body

  if (!id_mascota)     return res.status(400).json({ error: 'Datos inválidos', message: '"id_mascota" es obligatorio' })
  if (!id_veterinario) return res.status(400).json({ error: 'Datos inválidos', message: '"id_veterinario" es obligatorio' })
  if (!id_servicio)    return res.status(400).json({ error: 'Datos inválidos', message: '"id_servicio" es obligatorio' })
  if (!fecha_hora)     return res.status(400).json({ error: 'Datos inválidos', message: '"fecha_hora" es obligatorio' })

  const fecha = new Date(fecha_hora)
  if (isNaN(fecha.getTime())) return res.status(400).json({ error: 'Datos inválidos', message: '"fecha_hora" no es válida' })
  if (fecha <= new Date())    return res.status(400).json({ error: 'Datos inválidos', message: '"fecha_hora" debe ser futura' })

  // Verificar mascota
  const { data: mascota } = await supabaseAdmin
    .from('mascota').select('id').eq('id', id_mascota).eq('user_id', userId).single()
  if (!mascota) return res.status(400).json({ error: 'Mascota no válida', message: 'La mascota no existe o no te pertenece' })

  // Verificar veterinario
  const { data: vet } = await supabaseAdmin
    .from('veterinario').select('id').eq('id', id_veterinario).eq('activo', true).single()
  if (!vet) return res.status(400).json({ error: 'Veterinario no válido', message: 'El veterinario no existe o no está disponible' })

  // Verificar servicio
  const { data: servicio } = await supabaseAdmin
    .from('servicio').select('id').eq('id', id_servicio).eq('activo', true).single()
  if (!servicio) return res.status(400).json({ error: 'Servicio no válido', message: 'El servicio no existe o no está disponible' })

  // Insertar
  const { data: citaId, error: insertError } = await supabaseAdmin
    .from('cita')
    .insert({
      id_usuario: userId, id_mascota, id_veterinario, id_servicio,
      fecha_hora, estado: 'pendiente',
      notas_usuario: notas_usuario?.trim() || null
    })
    .select('id')
    .single()

  if (insertError) return res.status(500).json({ error: 'Error creando cita', message: insertError.message })

  // Recuperar con embed completo
  const { data: cita, error: selectError } = await supabaseAdmin
    .from('cita').select(SELECT_CITA_VET).eq('id', citaId.id).single()

  if (selectError) return res.status(201).json({ message: 'Cita creada. Está pendiente de confirmación.', cita: citaId })

  return res.status(201).json({ message: 'Cita creada correctamente. Está pendiente de confirmación.', cita })
}

// ------------------------------------------------------------
//  POST /api/citas/directa
//  Cita directa desde listado de clínicas.
//  Solo requiere: id_mascota, id_clinica, motivo, fecha_hora.
//  NO usa embed de clinica desde cita para evitar error de FK.
// ------------------------------------------------------------
export async function createCitaDirecta(req, res) {
  const userId = req.user.id
  const { id_mascota, id_clinica, motivo, fecha_hora } = req.body

  if (!id_mascota) return res.status(400).json({ error: 'Datos inválidos', message: '"id_mascota" es obligatorio' })
  if (!id_clinica) return res.status(400).json({ error: 'Datos inválidos', message: '"id_clinica" es obligatorio' })
  if (!motivo)     return res.status(400).json({ error: 'Datos inválidos', message: '"motivo" es obligatorio' })
  if (!fecha_hora) return res.status(400).json({ error: 'Datos inválidos', message: '"fecha_hora" es obligatorio' })

  const fecha = new Date(fecha_hora)
  if (isNaN(fecha.getTime())) return res.status(400).json({ error: 'Datos inválidos', message: '"fecha_hora" no es una fecha válida' })
  if (fecha <= new Date())    return res.status(400).json({ error: 'Datos inválidos', message: '"fecha_hora" debe ser una fecha futura' })

  // Verificar mascota
  const { data: mascota } = await supabaseAdmin
    .from('mascota').select('id, nombre').eq('id', id_mascota).eq('user_id', userId).single()
  if (!mascota) return res.status(400).json({ error: 'Mascota no válida', message: 'La mascota no existe o no te pertenece' })

  // Verificar clínica — query separada, sin embed desde cita
  const { data: clinica } = await supabaseAdmin
    .from('clinica').select('id, nombre, ciudad').eq('id', id_clinica).eq('activa', true).single()
  if (!clinica) return res.status(400).json({ error: 'Clínica no válida', message: 'La clínica no existe o no está disponible' })

  // Insertar la cita — campos mínimos, sin id_veterinario ni id_servicio
  const { data: citaInsertada, error: insertError } = await supabaseAdmin
    .from('cita')
    .insert({
      id_usuario:     userId,
      id_mascota,
      id_clinica,
      motivo:         motivo.trim(),
      fecha_hora,
      estado:         'pendiente',
      id_veterinario: null,
      id_servicio:    null
    })
    .select('id, fecha_hora, estado, motivo, created_at, id_clinica, mascota ( id, nombre )')
    .single()

  if (insertError) {
    return res.status(500).json({ error: 'Error creando cita', message: insertError.message })
  }

  // Combinar manualmente con datos de clínica (sin embed PostgREST)
  const citaFinal = {
    ...citaInsertada,
    clinica: {
      id:     clinica.id,
      nombre: clinica.nombre,
      ciudad: clinica.ciudad
    }
  }

  return res.status(201).json({
    message: 'Cita reservada correctamente. Está pendiente de confirmación.',
    cita: citaFinal
  })
}

// ------------------------------------------------------------
//  PATCH /api/citas/:id/cancelar
// ------------------------------------------------------------
export async function cancelarCita(req, res) {
  const userId = req.user.id
  const citaId = req.params.id

  const { data: cita } = await supabaseAdmin
    .from('cita').select('id, estado').eq('id', citaId).eq('id_usuario', userId).single()

  if (!cita) return res.status(404).json({ error: 'No encontrada', message: 'La cita no existe o no te pertenece' })

  if (!['pendiente', 'confirmada'].includes(cita.estado)) {
    return res.status(409).json({ error: 'No cancelable', message: `No se puede cancelar una cita en estado "${cita.estado}"` })
  }

  const { data: citaActualizada, error } = await supabaseAdmin
    .from('cita')
    .update({ estado: 'cancelada' })
    .eq('id', citaId)
    .select(SELECT_CITA_BASE)
    .single()

  if (error) return res.status(500).json({ error: 'Error cancelando cita', message: error.message })

  // Enriquecer con clínica si es cita directa
  const [citaEnriquecida] = await enriquecerConClinica([citaActualizada])

  return res.status(200).json({ message: 'Cita cancelada correctamente', cita: citaEnriquecida })
}
