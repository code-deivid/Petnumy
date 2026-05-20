// src/stores/settings.store.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { setLocale } from '@/i18n/index.js'

export const useSettingsStore = defineStore('settings', () => {

  // ── Tema (claro / oscuro) ──────────────────────────────────
  const savedTheme = localStorage.getItem('petnumy_theme') || 'light'
  const darkMode   = ref(savedTheme === 'dark')

  function applyTheme(dark) {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('petnumy_theme', dark ? 'dark' : 'light')
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    applyTheme(darkMode.value)
  }

  // ── Idioma ─────────────────────────────────────────────────
  const savedLocale = localStorage.getItem('petnumy_locale') || 'es'
  const locale      = ref(savedLocale)

  const LANGUAGES = [
    { code: 'es', label: 'Español',   flag: 'ES' },
    { code: 'en', label: 'English',   flag: 'EN' },
    { code: 'va', label: 'Valencià',  flag: 'VA' }
  ]

  function changeLocale(code) {
    locale.value = code
    setLocale(code)
  }

  // ── Inicialización ─────────────────────────────────────────
  // Aplicar tema guardado al montar
  function init() {
    applyTheme(darkMode.value)
  }

  return {
    darkMode, toggleDarkMode,
    locale, LANGUAGES, changeLocale,
    init
  }
})
