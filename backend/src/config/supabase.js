// src/config/supabase.js
// ============================================================
//  Dos clientes de Supabase:
//
//  supabase      → cliente anónimo. Se usa cuando queremos que
//                  RLS se aplique normalmente (lectura de catálogos,
//                  operaciones públicas).
//
//  supabaseAdmin → cliente con service_role. Bypasea RLS. Solo
//                  se usa en el backend para operaciones que el
//                  sistema realiza en nombre del usuario
//                  (crear perfil tras registro, insertar historial, etc.)
//                  NUNCA enviar esta clave al frontend.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL          = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY     = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  throw new Error('Faltan variables de entorno de Supabase. Revisa tu archivo .env')
}

// Cliente público (respeta RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Cliente administrador (bypasea RLS — solo uso interno del backend)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
