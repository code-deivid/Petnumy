// src/controllers/vacunas.controller.js
// ============================================================
//  Módulo de vacunas
//
//  Dos responsabilidades:
//    1. getCatalogoVacunas → catálogo general (tabla vacuna)
//    2. CRUD sobre vacuna_mascota para una mascota concreta
//
//  Seguridad: antes de operar sobre vacuna_mascota, siempre se
//  verifica que la mascota pertenece al usuario autenticado.
// ============================================================

import { supabaseAdmin } from '../config/supabase.js'

// ── Campos para SELECT de vacuna_mascota ─────────────────────
const SELECT_VACUNA_MASCOTA = `
  id,
  estado,
  fecha_aplicacion,
  proxima_aplicacion,
  created_at,
  vacuna (
    id,
    nombre,
    descripcion,
    especie (
      id,
      especie
    )
  )
`.trim()

// ── Estados válidos ──────────────────────────────────────────
const ESTADOS_VALIDOS = ['pendiente', 'puesta', 'retrasada']

// ── Helper: verificar que la mascota pertenece al usuario ────
// Devuelve la mascota si es válida, o null si no existe / no pertenece.
// Así evitamos repetir esta lógica en cada controlador.
async function verificarPropiedadMascota(mascotaId, userId) {
  const { data, error } = await supabaseAdmin
    .from('mascota')
    .select('id, nombre')
    .eq('id', mascotaId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data
}

// ── Validaciones ─────────────────────────────────────────────
function validarVacunaMascota(body, esCreacion = false) {
  const errores = []

  if (esCreacion && !body.id_vacuna) {
    errores.push('"id_vacuna" es obligatorio')
  }

  if (esCreacion && !body.estado) {
    errores.push('"estado" es obligatorio')
  }

  if (body.estado !== undefined && !ESTADOS_VALIDOS.includes(body.estado)) {
    errores.push(`"estado" debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`)
  }

  for (const campo of ['fecha_aplicacion', 'proxima_aplicacion']) {
    if (body[campo] !== undefined && body[campo] !== null) {
      const fecha = new Date(body[campo])
      if (isNaN(fecha.getTime())) {
        errores.push(`"${campo}" debe ser una fecha válida en formato YYYY-MM-DD`)
      }
    }
  }

  // Si se marca como 'puesta', la fecha de aplicación debería existir
  if (body.estado === 'puesta' && !body.fecha_aplicacion) {
    errores.push('Cuando el estado es "puesta", se recomienda incluir "fecha_aplicacion"')
  }

  return { valido: errores.length === 0, errores }
}

// ── Controladores ─────────────────────────────────────────────

// ------------------------------------------------------------
//  GET /api/vacunas
//  Catálogo general de vacunas, filtrable por especie
// ------------------------------------------------------------
export async function getCatalogoVacunas(req, res) {
  const { id_especie } = req.query

  let query = supabaseAdmin
    .from('vacuna')
    .select(`
      id,
      nombre,
      descripcion,
      created_at,
      especie (
        id,
        especie
      )
    `)
    .order('nombre', { ascending: true })

  // Filtro opcional por especie
  if (id_especie) {
    query = query.eq('id_especie', id_especie)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({
      error: 'Error obteniendo catálogo de vacunas',
      message: error.message
    })
  }

  return res.status(200).json({
    total: data.length,
    vacunas: data
  })
}

// ------------------------------------------------------------
//  GET /api/mascotas/:id/vacunas
//  Lista las vacunas de una mascota concreta
// ------------------------------------------------------------
export async function getVacunasMascota(req, res) {
  const userId    = req.user.id
  const mascotaId = req.params.id

  const mascota = await verificarPropiedadMascota(mascotaId, userId)
  if (!mascota) {
    return res.status(404).json({
      error: 'No encontrada',
      message: 'La mascota no existe o no te pertenece'
    })
  }

  const { data, error } = await supabaseAdmin
    .from('vacuna_mascota')
    .select(SELECT_VACUNA_MASCOTA)
    .eq('id_mascota', mascotaId)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({
      error: 'Error obteniendo vacunas de la mascota',
      message: error.message
    })
  }

  return res.status(200).json({
    mascota: { id: mascota.id, nombre: mascota.nombre },
    total: data.length,
    vacunas: data
  })
}

// ------------------------------------------------------------
//  POST /api/mascotas/:id/vacunas
//  Añade una vacuna al registro de una mascota
// ------------------------------------------------------------
export async function addVacunaMascota(req, res) {
  const userId    = req.user.id
  const mascotaId = req.params.id
  const { id_vacuna, estado, fecha_aplicacion, proxima_aplicacion } = req.body

  // 1. Verificar propiedad de la mascota
  const mascota = await verificarPropiedadMascota(mascotaId, userId)
  if (!mascota) {
    return res.status(404).json({
      error: 'No encontrada',
      message: 'La mascota no existe o no te pertenece'
    })
  }

  // 2. Validar campos
  const { valido, errores } = validarVacunaMascota(req.body, true)
  if (!valido) {
    return res.status(400).json({ error: 'Datos inválidos', errores })
  }

  // 3. Verificar que la vacuna existe en el catálogo
  const { data: vacuna, error: vacunaError } = await supabaseAdmin
    .from('vacuna')
    .select('id, nombre')
    .eq('id', id_vacuna)
    .single()

  if (vacunaError || !vacuna) {
    return res.status(400).json({
      error: 'Vacuna no válida',
      message: 'El id_vacuna proporcionado no existe en el catálogo'
    })
  }

  // 4. Insertar el registro
  const { data, error } = await supabaseAdmin
    .from('vacuna_mascota')
    .insert({
      id_mascota:          mascotaId,
      id_vacuna,
      estado,
      fecha_aplicacion:    fecha_aplicacion    || null,
      proxima_aplicacion:  proxima_aplicacion  || null
    })
    .select(SELECT_VACUNA_MASCOTA)
    .single()

  if (error) {
    return res.status(500).json({
      error: 'Error añadiendo vacuna',
      message: error.message
    })
  }

  return res.status(201).json({
    message: `Vacuna "${vacuna.nombre}" añadida correctamente a ${mascota.nombre}`,
    vacuna: data
  })
}

// ------------------------------------------------------------
//  PATCH /api/mascotas/:id/vacunas/:vacunaMascotaId
//  Actualiza estado o fechas de una vacuna de la mascota
// ------------------------------------------------------------
export async function updateVacunaMascota(req, res) {
  const userId           = req.user.id
  const mascotaId        = req.params.id
  const vacunaMascotaId  = req.params.vacunaMascotaId

  // 1. Verificar propiedad de la mascota
  const mascota = await verificarPropiedadMascota(mascotaId, userId)
  if (!mascota) {
    return res.status(404).json({
      error: 'No encontrada',
      message: 'La mascota no existe o no te pertenece'
    })
  }

  // 2. Filtrar solo campos editables
  const CAMPOS_EDITABLES = ['estado', 'fecha_aplicacion', 'proxima_aplicacion']
  const cambios = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (req.body[campo] !== undefined) cambios[campo] = req.body[campo]
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({
      error: 'Sin cambios',
      message: 'No se ha proporcionado ningún campo válido para actualizar'
    })
  }

  // 3. Validar
  const { valido, errores } = validarVacunaMascota(cambios, false)
  if (!valido) {
    return res.status(400).json({ error: 'Datos inválidos', errores })
  }

  // 4. Actualizar — filtramos también por id_mascota para seguridad
  const { data, error } = await supabaseAdmin
    .from('vacuna_mascota')
    .update(cambios)
    .eq('id', vacunaMascotaId)
    .eq('id_mascota', mascotaId)   // evita modificar vacunas de otras mascotas
    .select(SELECT_VACUNA_MASCOTA)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'El registro de vacuna no existe o no pertenece a esta mascota'
      })
    }
    return res.status(500).json({
      error: 'Error actualizando vacuna',
      message: error.message
    })
  }

  return res.status(200).json({
    message: 'Vacuna actualizada correctamente',
    vacuna: data
  })
}

// ------------------------------------------------------------
//  DELETE /api/mascotas/:id/vacunas/:vacunaMascotaId
//  Elimina el registro de una vacuna de la mascota
// ------------------------------------------------------------
export async function deleteVacunaMascota(req, res) {
  const userId           = req.user.id
  const mascotaId        = req.params.id
  const vacunaMascotaId  = req.params.vacunaMascotaId

  // 1. Verificar propiedad de la mascota
  const mascota = await verificarPropiedadMascota(mascotaId, userId)
  if (!mascota) {
    return res.status(404).json({
      error: 'No encontrada',
      message: 'La mascota no existe o no te pertenece'
    })
  }

  // 2. Verificar que el registro existe y pertenece a esta mascota
  const { data: registro, error: findError } = await supabaseAdmin
    .from('vacuna_mascota')
    .select('id, vacuna(nombre)')
    .eq('id', vacunaMascotaId)
    .eq('id_mascota', mascotaId)
    .single()

  if (findError || !registro) {
    return res.status(404).json({
      error: 'No encontrado',
      message: 'El registro de vacuna no existe o no pertenece a esta mascota'
    })
  }

  // 3. Eliminar
  const { error } = await supabaseAdmin
    .from('vacuna_mascota')
    .delete()
    .eq('id', vacunaMascotaId)

  if (error) {
    return res.status(500).json({
      error: 'Error eliminando vacuna',
      message: error.message
    })
  }

  return res.status(200).json({
    message: `Registro de vacuna "${registro.vacuna.nombre}" eliminado correctamente`
  })
}
