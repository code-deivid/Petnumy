// src/controllers/recordatorios.controller.js
import { supabaseAdmin } from '../config/supabase.js'

// ── SELECT completo con joins ─────────────────────────────────
const SELECT_RECORDATORIO = `
  id,
  recordar_cantidad,
  recordar_unidad,
  fecha_recordatorio,
  activo,
  created_at,
  vacuna_mascota:id_vacuna_mascota (
    id,
    estado,
    proxima_aplicacion,
    vacuna:id_vacuna (
      id,
      nombre
    ),
    mascota:id_mascota (
      id,
      nombre
    )
  )
`.trim()

// ── Unidades válidas ──────────────────────────────────────────
const UNIDADES_VALIDAS = ['minuto', 'hora', 'dia', 'semana', 'mes']

// ------------------------------------------------------------
//  GET /api/recordatorios
//  Recordatorios activos del usuario autenticado
// ------------------------------------------------------------
export async function getRecordatorios(req, res) {
  const userId = req.user.id

  const { data, error } = await supabaseAdmin
    .from('recordatorio_vacuna')
    .select(SELECT_RECORDATORIO)
    .eq('id_usuario', userId)
    .eq('activo', true)
    .order('fecha_recordatorio', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Error obteniendo recordatorios', message: error.message })
  }

  return res.status(200).json({ total: data.length, recordatorios: data })
}

// ------------------------------------------------------------
//  POST /api/recordatorios
//  Crear o actualizar recordatorio para una vacuna_mascota.
//  Si ya existe (mismo id_vacuna_mascota + id_usuario) → upsert.
// ------------------------------------------------------------
export async function upsertRecordatorio(req, res) {
  const userId = req.user.id
  const { id_vacuna_mascota, recordar_cantidad, recordar_unidad, proxima_aplicacion } = req.body

  // Validaciones
  if (!id_vacuna_mascota) {
    return res.status(400).json({ error: 'Datos inválidos', message: '"id_vacuna_mascota" es obligatorio' })
  }
  if (!Number.isInteger(recordar_cantidad) || recordar_cantidad < 1 || recordar_cantidad > 200) {
    return res.status(400).json({ error: 'Datos inválidos', message: '"recordar_cantidad" debe ser entre 1 y 200' })
  }
  if (!UNIDADES_VALIDAS.includes(recordar_unidad)) {
    return res.status(400).json({ error: 'Datos inválidos', message: `"recordar_unidad" debe ser: ${UNIDADES_VALIDAS.join(', ')}` })
  }
  if (!proxima_aplicacion) {
    return res.status(400).json({ error: 'Datos inválidos', message: '"proxima_aplicacion" es obligatorio para calcular la fecha de aviso' })
  }

  // Verificar que la vacuna_mascota pertenece al usuario
  const { data: vm, error: vmError } = await supabaseAdmin
    .from('vacuna_mascota')
    .select('id, id_mascota, mascota:id_mascota(user_id)')
    .eq('id', id_vacuna_mascota)
    .single()

  if (vmError || !vm) {
    return res.status(404).json({ error: 'No encontrado', message: 'La vacuna no existe' })
  }
  if (vm.mascota?.user_id !== userId) {
    return res.status(403).json({ error: 'Sin permiso', message: 'No tienes acceso a esta vacuna' })
  }

  // Calcular fecha de recordatorio
  const base = new Date(proxima_aplicacion)
  const fecha = calcularFechaRecordatorio(base, recordar_cantidad, recordar_unidad)

  // Upsert
  const { data, error } = await supabaseAdmin
    .from('recordatorio_vacuna')
    .upsert(
      {
        id_vacuna_mascota,
        id_usuario:        userId,
        recordar_cantidad,
        recordar_unidad,
        fecha_recordatorio: fecha.toISOString(),
        activo:            true
      },
      { onConflict: 'id_vacuna_mascota,id_usuario', ignoreDuplicates: false }
    )
    .select(SELECT_RECORDATORIO)
    .single()

  if (error) {
    return res.status(500).json({ error: 'Error guardando recordatorio', message: error.message })
  }

  return res.status(200).json({ message: 'Recordatorio guardado', recordatorio: data })
}

// ------------------------------------------------------------
//  DELETE /api/recordatorios/:id
//  Desactivar (soft delete) un recordatorio
// ------------------------------------------------------------
export async function deleteRecordatorio(req, res) {
  const userId = req.user.id
  const { id }  = req.params

  const { data, error } = await supabaseAdmin
    .from('recordatorio_vacuna')
    .update({ activo: false })
    .eq('id', id)
    .eq('id_usuario', userId)
    .select('id')
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'No encontrado', message: 'Recordatorio no encontrado o sin permiso' })
  }

  return res.status(200).json({ message: 'Recordatorio eliminado' })
}

// ── Helper: calcular fecha de aviso ──────────────────────────
function calcularFechaRecordatorio(baseDate, cantidad, unidad) {
  const d = new Date(baseDate)
  switch (unidad) {
    case 'minuto': d.setMinutes(d.getMinutes() - cantidad); break
    case 'hora':   d.setHours(d.getHours()     - cantidad); break
    case 'dia':    d.setDate(d.getDate()        - cantidad); break
    case 'semana': d.setDate(d.getDate()        - cantidad * 7); break
    case 'mes':    d.setMonth(d.getMonth()      - cantidad); break
  }
  return d
}
