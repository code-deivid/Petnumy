// src/controllers/mascotas.controller.js
import { supabaseAdmin } from '../config/supabase.js'

// ── SELECT — aliases explícitos para evitar ambigüedad con 2 FK a raza
// Supabase requiere alias:nombre_columna_fk(...) cuando hay más de una FK
// hacia la misma tabla (id_raza e id_raza_secundaria → ambas apuntan a raza).
const SELECT_FIELDS = `
  id,
  nombre,
  foto,
  nacimiento,
  genero,
  peso,
  microchip,
  es_mestizo,
  id_raza,
  id_raza_secundaria,
  created_at,
  raza:id_raza (
    id,
    nombre,
    id_especie,
    especie:id_especie (
      id,
      especie
    )
  ),
  raza_secundaria:id_raza_secundaria (
    id,
    nombre,
    id_especie
  )
`.trim()

// ── Campos editables en PATCH ─────────────────────────────────
const CAMPOS_EDITABLES = [
  'nombre', 'foto', 'nacimiento', 'genero', 'peso',
  'microchip', 'id_raza', 'es_mestizo', 'id_raza_secundaria'
]

// ── Validaciones ──────────────────────────────────────────────
function validarMascota(body, esCreacion = false) {
  const errores = []

  if (esCreacion) {
    if (!body.nombre?.trim()) errores.push('El campo "nombre" es obligatorio')
    if (!body.id_raza)        errores.push('El campo "id_raza" es obligatorio')
  }

  if (body.nombre !== undefined && !body.nombre?.trim()) {
    errores.push('"nombre" no puede estar vacío')
  }

  if (body.genero !== undefined && !['macho', 'hembra'].includes(body.genero)) {
    errores.push('"genero" debe ser "macho" o "hembra"')
  }

  if (body.peso !== undefined && body.peso !== null) {
    const p = Number(body.peso)
    if (isNaN(p) || p < 0) errores.push('"peso" debe ser un número >= 0')
  }

  if (body.nacimiento !== undefined && body.nacimiento !== null) {
    const f = new Date(body.nacimiento)
    if (isNaN(f.getTime())) errores.push('"nacimiento" debe ser una fecha válida')
    if (f > new Date())     errores.push('"nacimiento" no puede ser una fecha futura')
  }

  // Validaciones de mestizo
  if (body.es_mestizo === true) {
    if (!body.id_raza_secundaria) {
      errores.push('Si es mestizo, "id_raza_secundaria" es obligatorio')
    }
    if (body.id_raza && body.id_raza_secundaria && body.id_raza === body.id_raza_secundaria) {
      errores.push('"id_raza" e "id_raza_secundaria" no pueden ser iguales')
    }
  }

  return { valido: errores.length === 0, errores }
}

// ── Verificar que dos razas pertenecen a la misma especie ─────
async function razasMismaEspecie(idRaza1, idRaza2) {
  const { data, error } = await supabaseAdmin
    .from('raza')
    .select('id, id_especie')
    .in('id', [idRaza1, idRaza2])

  if (error || !data || data.length !== 2) return false
  return data[0].id_especie === data[1].id_especie
}

// ── GET /api/mascotas ─────────────────────────────────────────
export async function getMascotas(req, res) {
  const { data, error } = await supabaseAdmin
    .from('mascota')
    .select(SELECT_FIELDS)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'Error obteniendo mascotas', message: error.message })

  return res.status(200).json({ total: data.length, mascotas: data })
}

// ── GET /api/mascotas/:id ─────────────────────────────────────
export async function getMascotaById(req, res) {
  const { data, error } = await supabaseAdmin
    .from('mascota')
    .select(SELECT_FIELDS)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return res.status(404).json({ error: 'No encontrada', message: 'La mascota no existe o no te pertenece' })
    return res.status(500).json({ error: 'Error obteniendo mascota', message: error.message })
  }

  return res.status(200).json({ mascota: data })
}

// ── POST /api/mascotas ────────────────────────────────────────
export async function createMascota(req, res) {
  const { nombre, id_raza, nacimiento, genero, peso, microchip, foto,
          es_mestizo, id_raza_secundaria } = req.body

  const { valido, errores } = validarMascota(req.body, true)
  if (!valido) return res.status(400).json({ error: 'Datos inválidos', errores })

  // Verificar raza principal
  const { data: raza, error: razaErr } = await supabaseAdmin
    .from('raza').select('id').eq('id', id_raza).single()
  if (razaErr || !raza) return res.status(400).json({ error: 'Raza no válida', message: 'El id_raza proporcionado no existe' })

  // Verificar raza secundaria si mestizo
  if (es_mestizo && id_raza_secundaria) {
    const { data: raza2, error: raza2Err } = await supabaseAdmin
      .from('raza').select('id').eq('id', id_raza_secundaria).single()
    if (raza2Err || !raza2) return res.status(400).json({ error: 'Raza secundaria no válida', message: 'El id_raza_secundaria no existe' })

    const mismaEspecie = await razasMismaEspecie(id_raza, id_raza_secundaria)
    if (!mismaEspecie) return res.status(400).json({ error: 'Razas incompatibles', message: 'Ambas razas deben pertenecer a la misma especie' })
  }

  const { data, error } = await supabaseAdmin
    .from('mascota')
    .insert({
      user_id:            req.user.id,
      nombre:             nombre.trim(),
      id_raza,
      nacimiento:         nacimiento         || null,
      genero:             genero             || null,
      peso:               peso               ?? null,
      microchip:          microchip          || null,
      foto:               foto               || null,
      es_mestizo:         es_mestizo         ?? false,
      id_raza_secundaria: es_mestizo ? (id_raza_secundaria || null) : null
    })
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Microchip duplicado', message: 'Ya existe una mascota con ese microchip' })
    return res.status(500).json({ error: 'Error creando mascota', message: error.message })
  }

  return res.status(201).json({ message: 'Mascota creada correctamente', mascota: data })
}

// ── PATCH /api/mascotas/:id ───────────────────────────────────
export async function updateMascota(req, res) {
  const mascotaId = req.params.id

  const cambios = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (req.body[campo] !== undefined) cambios[campo] = req.body[campo]
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'Sin cambios', message: 'No se proporcionó ningún campo válido' })
  }

  const { valido, errores } = validarMascota(cambios, false)
  if (!valido) return res.status(400).json({ error: 'Datos inválidos', errores })

  // Si se actualiza es_mestizo=false, limpiar raza secundaria
  if (cambios.es_mestizo === false) {
    cambios.id_raza_secundaria = null
  }

  // Si mestizo y hay razas, verificar misma especie
  if (cambios.es_mestizo === true && cambios.id_raza && cambios.id_raza_secundaria) {
    const mismaEspecie = await razasMismaEspecie(cambios.id_raza, cambios.id_raza_secundaria)
    if (!mismaEspecie) return res.status(400).json({ error: 'Razas incompatibles', message: 'Ambas razas deben pertenecer a la misma especie' })
  }

  if (cambios.nombre) cambios.nombre = cambios.nombre.trim()

  const { data, error } = await supabaseAdmin
    .from('mascota')
    .update(cambios)
    .eq('id', mascotaId)
    .eq('user_id', req.user.id)
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return res.status(404).json({ error: 'No encontrada', message: 'La mascota no existe o no te pertenece' })
    if (error.code === '23505')    return res.status(409).json({ error: 'Microchip duplicado', message: 'Ya existe una mascota con ese microchip' })
    return res.status(500).json({ error: 'Error actualizando mascota', message: error.message })
  }

  return res.status(200).json({ message: 'Mascota actualizada correctamente', mascota: data })
}

// ── DELETE /api/mascotas/:id ──────────────────────────────────
export async function deleteMascota(req, res) {
  const mascotaId = req.params.id

  const { data: mascota, error: findError } = await supabaseAdmin
    .from('mascota').select('id, nombre').eq('id', mascotaId).eq('user_id', req.user.id).single()

  if (findError || !mascota) return res.status(404).json({ error: 'No encontrada', message: 'La mascota no existe o no te pertenece' })

  const { error } = await supabaseAdmin.from('mascota').delete().eq('id', mascotaId).eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: 'Error eliminando mascota', message: error.message })

  return res.status(200).json({ message: `Mascota "${mascota.nombre}" eliminada correctamente` })
}
