// src/controllers/especies.controller.js
// Catálogo de especies — solo lectura

import { supabaseAdmin } from '../config/supabase.js'

// GET /api/especies
export async function getEspecies(req, res) {
  const { data, error } = await supabaseAdmin
    .from('especie')
    .select('id, especie')
    .order('especie', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Error obteniendo especies', message: error.message })
  }

  return res.status(200).json({ total: data.length, especies: data })
}
