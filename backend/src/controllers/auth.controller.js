// src/controllers/auth.controller.js
// ============================================================
//  Controlador de autenticación — v2
//
//  CORRECCIÓN PRINCIPAL:
//  - registro: usa supabaseAdmin.auth.admin.createUser()
//    en lugar de supabase.auth.signUp() con cliente anon.
//    Esto evita el error "permission denied for schema public"
//    porque el service_role bypasea RLS en Auth y en public.
//  - El insert en public.usuario también usa supabaseAdmin,
//    que tiene permisos completos sin depender de RLS.
// ============================================================

import { supabase, supabaseAdmin } from "../config/supabase.js";

// ------------------------------------------------------------
//  POST /api/auth/registro
// ------------------------------------------------------------
// Función registro — auth.controller.js

export async function registro(req, res) {
  const { email, password, nombre, apellidos } = req.body;

  // ── Validaciones básicas ────────────────────────────────────
  if (!email || !password || !nombre) {
    return res.status(400).json({
      error: "Campos requeridos",
      message: "Email, contraseña y nombre son obligatorios",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "Contraseña débil",
      message: "La contraseña debe tener al menos 6 caracteres",
    });
  }

  // ── DIAGNÓSTICO: confirmar que la service key está cargada ──
  // Elimina este bloque una vez confirmado que funciona.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!serviceKey || serviceKey === process.env.SUPABASE_ANON_KEY) {
    console.error(
      "[AUTH] ERROR: SUPABASE_SERVICE_ROLE_KEY no está definida o es igual a ANON_KEY",
    );
    return res.status(500).json({
      error: "Configuración incorrecta",
      message:
        "El servidor no tiene configurada la clave de servicio de Supabase. Revisa el .env",
    });
  }

  // ── 1. Crear usuario en Auth con service_role ───────────────
  // IMPORTANTE: usamos supabaseAdmin.auth.admin.createUser, NO supabase.auth.signUp
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // sin necesidad de confirmar email
    });

  if (authError) {
    console.error("[AUTH] Error en createUser:", authError);
    return res.status(400).json({
      error: "Error en el registro",
      message: authError.message,
    });
  }

  const userId = authData.user?.id;

  if (!userId) {
    return res.status(500).json({
      error: "Error interno",
      message: "No se pudo obtener el ID del usuario creado",
    });
  }

  // ── 2. Insertar perfil en public.usuario con supabaseAdmin ──
  // service_role bypasea RLS — no hay "permission denied"
  const { error: profileError } = await supabaseAdmin.from("usuario").insert({
    id: userId,
    nombre: nombre.trim(),
    apellidos: apellidos?.trim() || null,
  });

  if (profileError) {
    console.error("[AUTH] Error insertando perfil:", profileError);
    // Revertir: eliminar el usuario de Auth si falla el perfil
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return res.status(500).json({
      error: "Error creando perfil",
      message: profileError.message,
    });
  }

  return res.status(201).json({
    message: "Cuenta creada correctamente. Ya puedes iniciar sesión.",
    usuario: {
      id: userId,
      email: authData.user.email,
      nombre: nombre.trim(),
      apellidos: apellidos?.trim() || null,
    },
  });
}

// ------------------------------------------------------------
//  POST /api/auth/login
// ------------------------------------------------------------
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Campos requeridos",
      message: "Email y contraseña son obligatorios",
    });
  }

  // Login con cliente anon — correcto para obtener tokens de sesión
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({
      error: "Credenciales incorrectas",
      message: error.message,
    });
  }

  // Obtener perfil de public.usuario
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from("usuario")
    .select("id, nombre, apellidos, foto")
    .eq("id", data.user.id)
    .single();

  if (perfilError) {
    return res.status(500).json({
      error: "Error obteniendo perfil",
      message: perfilError.message,
    });
  }

  return res.status(200).json({
    message: "Login correcto",
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
    usuario: {
      id: perfil.id,
      email: data.user.email,
      nombre: perfil.nombre,
      apellidos: perfil.apellidos,
      foto: perfil.foto,
    },
  });
}

// ------------------------------------------------------------
//  POST /api/auth/logout
// ------------------------------------------------------------
export async function logout(req, res) {
  // El frontend descarta el token localmente.
  // Aquí simplemente confirmamos el logout.
  return res.status(200).json({ message: "Sesión cerrada correctamente" });
}

// ------------------------------------------------------------
//  POST /api/auth/refresh
// ------------------------------------------------------------
export async function refresh(req, res) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: "Campos requeridos",
      message: "refresh_token es obligatorio",
    });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error) {
    return res.status(401).json({
      error: "No se pudo renovar la sesión",
      message: error.message,
    });
  }

  return res.status(200).json({
    message: "Sesión renovada",
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
}

// ------------------------------------------------------------
//  GET /api/auth/me
// ------------------------------------------------------------
export async function me(req, res) {
  const userId = req.user.id;

  const { data: perfil, error } = await supabaseAdmin
    .from("usuario")
    .select("id, nombre, apellidos, foto, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    return res.status(404).json({
      error: "Perfil no encontrado",
      message: error.message,
    });
  }

  return res.status(200).json({
    usuario: {
      id: perfil.id,
      email: req.user.email,
      nombre: perfil.nombre,
      apellidos: perfil.apellidos,
      foto: perfil.foto,
      created_at: perfil.created_at,
    },
  });
}

// ------------------------------------------------------------
//  PATCH /api/auth/me
// ------------------------------------------------------------
export async function actualizarPerfil(req, res) {
  const userId = req.user.id;
  const { nombre, apellidos, foto } = req.body;

  const cambios = {};
  if (nombre !== undefined) cambios.nombre = nombre;
  if (apellidos !== undefined) cambios.apellidos = apellidos;
  if (foto !== undefined) cambios.foto = foto;

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({
      error: "Sin cambios",
      message: "No se ha proporcionado ningún campo para actualizar",
    });
  }

  const { data, error } = await supabaseAdmin
    .from("usuario")
    .update(cambios)
    .eq("id", userId)
    .select("id, nombre, apellidos, foto")
    .single();

  if (error) {
    return res.status(500).json({
      error: "Error actualizando perfil",
      message: error.message,
    });
  }

  return res.status(200).json({
    message: "Perfil actualizado correctamente",
    usuario: data,
  });
}
