import { createI18n } from 'vue-i18n'
import es from './locales/es.json'
import en from './locales/en.json'
import va from './locales/va.json'

// Idioma guardado o por defecto español
const savedLocale = localStorage.getItem('petnumy_locale') || 'es'

const i18n = createI18n({
  legacy: false,          
  locale: savedLocale,
  fallbackLocale: 'es',
  messages: { es, en, va }
})

export default i18n

// Helper para cambiar idioma desde cualquier componente
export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('petnumy_locale', locale)
  document.documentElement.setAttribute('lang', locale)
}
