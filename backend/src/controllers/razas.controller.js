// src/controllers/razas.controller.js
// ============================================================
//  Módulo de razas — solo lectura
//  Devuelve el catálogo de razas, filtrable por especie.
// ============================================================

import { supabaseAdmin } from '../config/supabase.js'

// ------------------------------------------------------------
//  GET /api/razas
//  Lista todas las razas. Filtro opcional: ?id_especie=
// ------------------------------------------------------------
export async function getRazas(req, res) {
  const { id_especie } = req.query

  let query = supabaseAdmin
    .from('raza')
    .select('id, nombre, id_especie')
    .order('nombre', { ascending: true })

  if (id_especie?.trim()) {
    query = query.eq('id_especie', id_especie.trim())
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({
      error: 'Error obteniendo razas',
      message: error.message
    })
  }

  return res.status(200).json({
    total: data.length,
    razas: data
  })
}
