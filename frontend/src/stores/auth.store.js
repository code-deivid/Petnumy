//  Store de autenticación — Pinia
//  Gestiona el usuario y la sesión de forma global.
//  El resto de la app lee de aquí en lugar de localStorage.
// ============================================================

import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // ── Estado ─────────────────────────────────────────────────
  const usuario = ref(null); // { id, email, nombre, apellidos, foto }
  const accessToken = ref(null);
  const refreshToken = ref(null);

  // ── Getters ────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!accessToken.value);
  const nombreUsuario = computed(() => usuario.value?.nombre || "Usuario");

  // ── Acciones ───────────────────────────────────────────────

  // Guarda sesión tras login o registro exitoso
  function setSession(data) {
    usuario.value = data.usuario;
    accessToken.value = data.session.access_token;
    refreshToken.value = data.session.refresh_token;

    // Persistimos en localStorage para sobrevivir recargas
    localStorage.setItem("petnumy_token", data.session.access_token);
    localStorage.setItem("petnumy_refresh", data.session.refresh_token);
    localStorage.setItem("petnumy_usuario", JSON.stringify(data.usuario));
  }

  // Limpia sesión al hacer logout
  function clearSession() {
    usuario.value = null;
    accessToken.value = null;
    refreshToken.value = null;

    localStorage.removeItem("petnumy_token");
    localStorage.removeItem("petnumy_refresh");
    localStorage.removeItem("petnumy_usuario");
  }

  // Restaura sesión desde localStorage al arrancar la app
  function restoreSession() {
    const token = localStorage.getItem("petnumy_token");
    const refresh = localStorage.getItem("petnumy_refresh");
    const user = localStorage.getItem("petnumy_usuario");

    if (token && user) {
      accessToken.value = token;
      refreshToken.value = refresh;
      usuario.value = JSON.parse(user);
    }
  }

  // Actualiza solo los datos del perfil (sin tocar tokens)
  function setUsuario(nuevoUsuario) {
    usuario.value = nuevoUsuario;
    localStorage.setItem("petnumy_usuario", JSON.stringify(nuevoUsuario));
  }

  return {
    // Estado
    usuario,
    accessToken,
    refreshToken,
    // Getters
    isLoggedIn,
    nombreUsuario,
    // Acciones
    setSession,
    clearSession,
    restoreSession,
    setUsuario,
  };
});
