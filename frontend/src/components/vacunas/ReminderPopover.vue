<!-- src/components/vacunas/ReminderPopover.vue -->
<!-- Teleport al body → nunca queda cortado por overflow del padre -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordatorios } from '@/composables/useRecordatorios.js'

const props = defineProps({
  visible:          { type: Boolean, default: false },
  vacunaMascotaId:  { type: String,  default: '' },
  proximaAplicacion:{ type: String,  default: '' },
  nombreVacuna:     { type: String,  default: '' },
  triggerEl:        { default: null }   // elemento DOM del botón campana
})
const emit = defineEmits(['close'])
const { t, locale } = useI18n()

const { getDeVacuna, guardar, eliminar } = useRecordatorios()

// ── Posición calculada ────────────────────────────────────────
// El popover se renderiza en <body> vía Teleport y se posiciona
// con position:fixed calculado desde el botón trigger.
const pos = ref({ top: '0px', left: '0px' })

const isMobileMode = ref(false)

function calcPos() {
  const vw = window.innerWidth
  isMobileMode.value = vw < 680

  // En móvil: NO calculamos posición — el CSS centra con overlay flex
  if (isMobileMode.value) return

  // Desktop: posicionamiento relativo al botón trigger
  if (!props.triggerEl) return
  const rect = props.triggerEl.getBoundingClientRect()
  const pw   = 290
  const ph   = 420
  const vh   = window.innerHeight

  // Horizontal: derecha del botón, si no cabe → izquierda
  let left = rect.right - pw
  if (left < 8) left = 8
  if (left + pw > vw - 8) left = vw - pw - 8

  // Vertical: intentar arriba, si no → abajo
  // IMPORTANTE: position:fixed → coordenadas de viewport, sin scrollY
  let top
  const spaceAbove = rect.top
  const spaceBelow = vh - rect.bottom
  if (spaceAbove >= ph + 8 || spaceAbove > spaceBelow) {
    top = rect.top - ph - 6
    if (top < 8) top = rect.bottom + 6
  } else {
    top = rect.bottom + 6
    if (top + ph > vh - 8) top = vh - ph - 8
  }
  if (top < 8) top = 8

  pos.value = { top: top + 'px', left: left + 'px' }
}

watch(() => props.visible, async (v) => {
  if (!v) return
  // Precargar opción del recordatorio activo
  errorMsg.value   = null
  modoCustom.value = false
  const rec = recordatorioActual.value
  if (!rec) {
    opcionId.value = 'none'
  } else {
    const match = OPCIONES.find(o => o.cantidad === rec.recordar_cantidad && o.unidad === rec.recordar_unidad)
    if (match) {
      opcionId.value   = match.id
      modoCustom.value = false
    } else {
      opcionId.value       = 'custom'
      modoCustom.value     = true
      customCantidad.value = rec.recordar_cantidad
      customUnidad.value   = rec.recordar_unidad
    }
  }
  await nextTick()
  calcPos()
})

function onScrollResize() { if (props.visible) calcPos() }
onMounted(() => {
  window.addEventListener('scroll', onScrollResize, true)
  window.addEventListener('resize', onScrollResize)
  document.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollResize, true)
  window.removeEventListener('resize', onScrollResize)
  document.removeEventListener('mousedown', onClickOutside)
})

function onClickOutside(e) {
  if (!props.visible) return
  const popover = document.getElementById('reminder-popover')
  if (popover && popover.contains(e.target)) return
  if (props.triggerEl && props.triggerEl.contains(e.target)) return
  emit('close')
}

// ── Estado ────────────────────────────────────────────────────
const guardando    = ref(false)
const errorMsg     = ref(null)
const modoCustom   = ref(false)
const opcionId     = ref('none')
const customCantidad = ref(1)
const customUnidad   = ref('dia')

const recordatorioActual = computed(() => getDeVacuna(props.vacunaMascotaId))

const OPCIONES = [
  { id: 'none',      label: 'Ninguno',         cantidad: null, unidad: null },
  { id: '1-dia',     label: '1 día antes',      cantidad: 1,    unidad: 'dia' },
  { id: '2-dias',    label: '2 días antes',     cantidad: 2,    unidad: 'dia' },
  { id: '1-semana',  label: '1 semana antes',   cantidad: 1,    unidad: 'semana' },
  { id: '2-semanas', label: '2 semanas antes',  cantidad: 2,    unidad: 'semana' },
  { id: '1-mes',     label: '1 mes antes',      cantidad: 1,    unidad: 'mes' },
  { id: '3-meses',   label: '3 meses antes',    cantidad: 3,    unidad: 'mes' },
  { id: '6-meses',   label: '6 meses antes',    cantidad: 6,    unidad: 'mes' },
  { id: 'custom',    label: 'Personalizado…',   cantidad: null, unidad: null },
]

function opcionLabel(op) {
  const map = {
    'none': 'reminders.options.none',
    '1-dia': 'reminders.options.oneDay',
    '2-dias': 'reminders.options.twoDays',
    '1-semana': 'reminders.options.oneWeek',
    '2-semanas': 'reminders.options.twoWeeks',
    '1-mes': 'reminders.options.oneMonth',
    '3-meses': 'reminders.options.threeMonths',
    '6-meses': 'reminders.options.sixMonths',
    'custom': 'reminders.options.custom'
  }
  return map[op.id] ? t(map[op.id]) : op.label
}

function unidadLabel(u) {
  const map = { minuto: 'reminders.units.minute', hora: 'reminders.units.hour', dia: 'reminders.units.day', semana: 'reminders.units.week', mes: 'reminders.units.month' }
  return map[u.val] ? t(map[u.val]) : u.label
}

const UNIDADES = [
  { val: 'minuto', label: 'minuto(s)' },
  { val: 'hora',   label: 'hora(s)'   },
  { val: 'dia',    label: 'día(s)'    },
  { val: 'semana', label: 'semana(s)' },
  { val: 'mes',    label: 'mes(es)'   },
]

// Preview de fecha de aviso
const fechaAviso = computed(() => {
  if (!props.proximaAplicacion || opcionId.value === 'none') return null
  let cantidad, unidad
  if (opcionId.value === 'custom') {
    cantidad = customCantidad.value
    unidad   = customUnidad.value
  } else {
    const op = OPCIONES.find(o => o.id === opcionId.value)
    if (!op?.cantidad) return null
    cantidad = op.cantidad
    unidad   = op.unidad
  }
  const d = new Date(props.proximaAplicacion + 'T12:00:00')
  switch (unidad) {
    case 'minuto': d.setMinutes(d.getMinutes() - cantidad); break
    case 'hora':   d.setHours(d.getHours()     - cantidad); break
    case 'dia':    d.setDate(d.getDate()        - cantidad); break
    case 'semana': d.setDate(d.getDate()        - cantidad * 7); break
    case 'mes':    d.setMonth(d.getMonth()      - cantidad); break
  }
  return d.toLocaleDateString(locale.value === 'en' ? 'en-GB' : locale.value === 'va' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
})

function elegir(op) {
  opcionId.value   = op.id
  modoCustom.value = op.id === 'custom'
}

async function confirmar() {
  errorMsg.value = null
  if (opcionId.value === 'none') {
    if (recordatorioActual.value) {
      guardando.value = true
      await eliminar(recordatorioActual.value.id, props.vacunaMascotaId)
      guardando.value = false
    }
    emit('close')
    return
  }
  if (!props.proximaAplicacion) {
    errorMsg.value = t('reminders.needNextDose')
    return
  }
  let cantidad, unidad
  if (opcionId.value === 'custom') {
    cantidad = Number(customCantidad.value)
    unidad   = customUnidad.value
    if (!cantidad || cantidad < 1 || cantidad > 200) {
      errorMsg.value = t('reminders.quantityError')
      return
    }
  } else {
    const op = OPCIONES.find(o => o.id === opcionId.value)
    cantidad = op.cantidad; unidad = op.unidad
  }
  guardando.value = true
  const { ok, data } = await guardar({
    id_vacuna_mascota:  props.vacunaMascotaId,
    recordar_cantidad:  cantidad,
    recordar_unidad:    unidad,
    proxima_aplicacion: props.proximaAplicacion
  })
  guardando.value = false
  if (!ok) { errorMsg.value = data.message || t('reminders.saveError'); return }
  emit('close')
}
</script>

<template>
  <!-- Teleport → siempre visible, nunca cortado por overflow -->
  <Teleport to="body">
    <!-- Overlay visible solo en móvil para centrar el popover -->
    <div
      v-if="visible && isMobileMode"
      class="rp-mobile-overlay"
      @click="emit('close')"
    />
    <Transition name="rp-fade">
      <div
        v-if="visible"
        id="reminder-popover"
        class="rp-popover"
        :class="{ 'rp-popover--mobile': isMobileMode }"
        :style="isMobileMode ? {} : { top: pos.top, left: pos.left }"
      >
        <!-- Cabecera -->
        <div class="rp-header">
          <div class="rp-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <div class="rp-title-wrap">
            <p class="rp-title">{{ t("reminders.reminder") }}</p>
            <p class="rp-sub">{{ nombreVacuna }}</p>
          </div>
          <button type="button" class="rp-close" @click="$emit('close')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Sin próxima dosis -->
        <div v-if="!proximaAplicacion" class="rp-no-fecha">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <p>{{ t("reminders.needNextDose") }}</p>
        </div>

        <template v-else>
          <!-- Opciones -->
          <div class="rp-opciones">
            <button type="button"
              v-for="op in OPCIONES"
              :key="op.id"
              class="rp-opcion"
              :class="{ 'rp-opcion--on': opcionId === op.id }"
              @click="elegir(op)"
            >
              <span>{{ opcionLabel(op) }}</span>
              <svg v-if="opcionId === op.id" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>

          <!-- Personalizado -->
          <Transition name="fade">
            <div v-if="modoCustom" class="rp-custom">
              <div class="rp-custom-row">
                <input
                  v-model.number="customCantidad"
                  type="number" min="1" max="200"
                  class="input rp-num"
                />
                <select v-model="customUnidad" class="input rp-unit">
                  <option v-for="u in UNIDADES" :key="u.val" :value="u.val">{{ unidadLabel(u) }}</option>
                </select>
                <span class="rp-suffix">{{ t("reminders.before") }}</span>
              </div>
            </div>
          </Transition>

          <!-- Preview fecha -->
          <Transition name="fade">
            <div v-if="fechaAviso" class="rp-preview">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{{ t('reminders.noticeOn') }} <strong>{{ fechaAviso }}</strong></span>
            </div>
          </Transition>

          <!-- Error -->
          <p v-if="errorMsg" class="rp-error">{{ errorMsg }}</p>

          <!-- Botón -->
          <button type="button" class="btn btn-teal rp-btn" :disabled="guardando" @click="confirmar">
            <span v-if="guardando" class="spinner" style="width:12px;height:12px;border-width:2px"/>
            <span v-else-if="opcionId === 'none'">{{ t("reminders.remove") }}</span>
            <span v-else>{{ t("reminders.save") }}</span>
          </button>
        </template>

      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* NO scoped — fuera del DOM del padre por Teleport */
.rp-popover {
  position: fixed;
  width: 285px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 40px rgba(60,46,31,0.18);
  border: 1px solid var(--color-border);
  z-index: 9000;
  overflow: hidden;
}

.rp-header {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.8rem 0.9rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-alt);
}
.rp-icon {
  width: 26px; height: 26px; border-radius: var(--radius-xs);
  background: var(--color-teal-light); color: var(--color-teal-dark);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rp-title-wrap { flex: 1; min-width: 0; }
.rp-title { font-family: var(--font-display); font-weight: 700; font-size: 0.78rem; color: var(--color-text); margin: 0; }
.rp-sub   { font-size: 0.67rem; color: var(--color-text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rp-close {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--color-border); color: var(--color-text-soft);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  cursor: pointer; border: none;
  transition: background var(--transition-fast);
}
.rp-close:hover { background: var(--color-danger-light); color: var(--color-danger); }

.rp-no-fecha {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.9rem; font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.4;
}

.rp-opciones {
  padding: 0.35rem 0.4rem;
  display: flex; flex-direction: column; gap: 0.05rem;
}
.rp-opcion {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.45rem 0.65rem; border-radius: var(--radius-sm);
  font-family: var(--font-display); font-weight: 600; font-size: 0.78rem;
  color: var(--color-text-soft); background: none; border: none; cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.rp-opcion:hover { background: var(--color-surface-alt); color: var(--color-text); }
.rp-opcion--on   { background: var(--color-teal-light);  color: var(--color-teal-dark); font-weight: 700; }

.rp-custom { padding: 0 0.75rem 0.4rem; }
.rp-custom-row { display: flex; align-items: center; gap: 0.4rem; }
.rp-num  { width: 60px; flex-shrink: 0; padding: 0.4rem 0.5rem; text-align: center; font-size: 0.85rem; }
.rp-unit { flex: 1; padding: 0.4rem 0.5rem; font-size: 0.85rem; }
.rp-suffix { font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap; }

.rp-preview {
  display: flex; align-items: center; gap: 0.4rem;
  margin: 0 0.75rem 0.4rem;
  padding: 0.45rem 0.65rem;
  background: var(--color-teal-light);
  border-radius: var(--radius-sm);
  font-size: 0.72rem; color: var(--color-teal-dark);
}

.rp-error { font-size: 0.72rem; color: var(--color-danger); padding: 0 0.75rem 0.3rem; margin: 0; }

.rp-btn {
  width: calc(100% - 1.5rem);
  margin: 0.35rem 0.75rem 0.75rem;
  font-size: 0.78rem; padding: 0.55rem;
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
}

/* Animación */
.rp-fade-enter-active, .rp-fade-leave-active {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(.22,1,.36,1);
}
.rp-fade-enter-from, .rp-fade-leave-to { opacity: 0; transform: scale(0.95) translateY(-4px); }

/* ── Modo móvil: modal centrado en viewport ─────────────── */
.rp-mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30,20,14,0.40);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 8999;
}

.rp-popover--mobile {
  /* Centrado en viewport puro — el :style binding es {} cuando mobile */
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: min(320px, calc(100vw - 32px));
  max-height: 88dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.rp-popover--mobile.rp-fade-enter-from,
.rp-popover--mobile.rp-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.93);
}

@media (max-width: 680px) {
  .rp-popover {
    width: min(320px, calc(100vw - 32px));
  }
}
</style>
