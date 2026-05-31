//  Estado global de recordatorios — compartido entre navbar
//  y cualquier página que lo use.
//  Patrón singleton: el array vive fuera de la función,
//  así todos los componentes leen el mismo ref.
// ============================================================

import { ref, computed } from 'vue'
import { useApi } from './useApi.js'

// ── Singleton ─────────────────────────────────────────────────
const recordatorios   = ref([])
const cargando        = ref(false)
const _cargado        = ref(false)   // evitar múltiples fetches simultáneos

export function useRecordatorios() {
  const { get, post, remove } = useApi()

  const hasRecordatorios = computed(() => recordatorios.value.length > 0)

  // ── Cargar desde backend ────────────────────────────────────
  async function cargar(forzar = false) {
    if (cargando.value) return
    if (_cargado.value && !forzar) return

    cargando.value = true
    const { ok, data } = await get('/api/recordatorios')
    cargando.value = false
    _cargado.value  = true

    if (ok && data.recordatorios) {
      recordatorios.value = data.recordatorios
    }
  }

  // ── Obtener recordatorio de una vacuna_mascota concreta ─────
  function getDeVacuna(idVacunaMascota) {
    return recordatorios.value.find(
      r => r.vacuna_mascota?.id === idVacunaMascota && r.activo
    ) || null
  }

  // ── Guardar (upsert) ────────────────────────────────────────
  async function guardar(payload) {
    // payload: { id_vacuna_mascota, recordar_cantidad, recordar_unidad, proxima_aplicacion }
    const { ok, data } = await post('/api/recordatorios', payload)
    if (ok && data.recordatorio) {
      // Reemplazar o añadir en el array local
      const idx = recordatorios.value.findIndex(
        r => r.vacuna_mascota?.id === payload.id_vacuna_mascota
      )
      if (idx !== -1) recordatorios.value[idx] = data.recordatorio
      else            recordatorios.value.unshift(data.recordatorio)
    }
    return { ok, data }
  }

  // ── Eliminar ────────────────────────────────────────────────
  async function eliminar(idRecordatorio, idVacunaMascota) {
    const { ok } = await remove(`/api/recordatorios/${idRecordatorio}`)
    if (ok) {
      recordatorios.value = recordatorios.value.filter(
        r => r.id !== idRecordatorio
      )
    }
    return ok
  }

  // ── Limpiar al cerrar sesión ────────────────────────────────
  function reset() {
    recordatorios.value = []
    _cargado.value       = false
  }

  return {
    recordatorios,
    hasRecordatorios,
    cargando,
    cargar,
    getDeVacuna,
    guardar,
    eliminar,
    reset
  }
}
