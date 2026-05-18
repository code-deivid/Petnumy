<!-- src/components/ui/DatePicker.vue -->
<!-- Calendario custom pastel — estilo Petnumy -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },   // YYYY-MM-DD
  placeholder:{ type: String, default: 'Fecha de nacimiento' },
  maxDate:    { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const abierto  = ref(false)
const wrapRef  = ref(null)

// Estado interno del calendario
const hoy = new Date()
const vistaAño = ref(hoy.getFullYear())
const vistaAño2 = ref(hoy.getFullYear()) // para selector de año
const vistaM   = ref(hoy.getMonth())  // 0-11
const modoPicker = ref('dias')  // 'dias' | 'meses' | 'años'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['L','M','X','J','V','S','D']

// Fecha seleccionada parseada
const seleccionada = computed(() => {
  if (!props.modelValue) return null
  const [y, m, d] = props.modelValue.split('-').map(Number)
  return new Date(y, m - 1, d)
})

// Etiqueta para el trigger
const etiqueta = computed(() => {
  if (!seleccionada.value) return ''
  return seleccionada.value.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
})

// Días del mes en vista
const diasEnMes = computed(() => {
  const primero = new Date(vistaAño.value, vistaM.value, 1)
  const ultimo  = new Date(vistaAño.value, vistaM.value + 1, 0)
  // Ajuste: lunes = 0
  let inicioSemana = primero.getDay() - 1
  if (inicioSemana < 0) inicioSemana = 6

  const dias = []
  // Días vacíos del inicio
  for (let i = 0; i < inicioSemana; i++) dias.push(null)
  // Días del mes
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(d)
  return dias
})

// Rango de años para el picker
const añosRango = computed(() => {
  const base = vistaAño2.value - 6
  return Array.from({ length: 16 }, (_, i) => base + i)
})

function irMesAnterior() {
  if (vistaM.value === 0) { vistaM.value = 11; vistaAño.value-- }
  else vistaM.value--
}
function irMesSiguiente() {
  if (vistaM.value === 11) { vistaM.value = 0; vistaAño.value++ }
  else vistaM.value++
}

function estaDeshabilitado(dia) {
  if (!dia) return true
  const fecha = new Date(vistaAño.value, vistaM.value, dia)
  if (props.maxDate) {
    const max = new Date(props.maxDate)
    if (fecha > max) return true
  }
  return false
}

function esSeleccionado(dia) {
  if (!dia || !seleccionada.value) return false
  const s = seleccionada.value
  return dia === s.getDate() && vistaM.value === s.getMonth() && vistaAño.value === s.getFullYear()
}

function esHoy(dia) {
  if (!dia) return false
  return dia === hoy.getDate() && vistaM.value === hoy.getMonth() && vistaAño.value === hoy.getFullYear()
}

function seleccionarDia(dia) {
  if (estaDeshabilitado(dia)) return
  const mm = String(vistaM.value + 1).padStart(2, '0')
  const dd = String(dia).padStart(2, '0')
  emit('update:modelValue', `${vistaAño.value}-${mm}-${dd}`)
  abierto.value = false
}

function seleccionarMes(idx) {
  vistaM.value = idx
  modoPicker.value = 'dias'
}

function seleccionarAño(año) {
  vistaAño.value = año
  modoPicker.value = 'meses'
}

function limpiar(e) {
  e.stopPropagation()
  emit('update:modelValue', '')
}

function abrirCalendario() {
  abierto.value = !abierto.value
  modoPicker.value = 'dias'
  // Si hay fecha seleccionada, navegar a ese mes
  if (seleccionada.value) {
    vistaAño.value = seleccionada.value.getFullYear()
    vistaM.value   = seleccionada.value.getMonth()
  }
}

// Click fuera
function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) abierto.value = false
}
onMounted(()    => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div class="dp-wrap" ref="wrapRef">

    <!-- Trigger -->
    <div
      class="dp-trigger"
      :class="{ 'dp-trigger--open': abierto, 'dp-trigger--filled': !!modelValue }"
      @click="abrirCalendario"
    >
      <svg class="dp-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span v-if="etiqueta" class="dp-value">{{ etiqueta }}</span>
      <span v-else class="dp-placeholder">{{ placeholder }}</span>

      <button v-if="modelValue" class="dp-clear" type="button" @click.stop="limpiar" tabindex="-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Calendario flotante -->
    <Transition name="dp-drop">
      <div v-if="abierto" class="dp-calendar">

        <!-- Header navegación -->
        <div class="dp-header">
          <button type="button" class="dp-nav-btn" @click="modoPicker === 'dias' ? irMesAnterior() : (vistaAño2 -= 16)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div class="dp-header-labels">
            <button type="button" class="dp-header-btn" @click="modoPicker = modoPicker === 'meses' ? 'dias' : 'meses'">
              {{ MESES[vistaM] }}
            </button>
            <button type="button" class="dp-header-btn" @click="modoPicker = modoPicker === 'años' ? 'dias' : 'años'; vistaAño2 = vistaAño">
              {{ vistaAño }}
            </button>
          </div>

          <button type="button" class="dp-nav-btn" @click="modoPicker === 'dias' ? irMesSiguiente() : (vistaAño2 += 16)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Vista: días -->
        <div v-if="modoPicker === 'dias'" class="dp-grid">
          <div v-for="d in DIAS" :key="d" class="dp-weekday">{{ d }}</div>
          <button
            v-for="(dia, i) in diasEnMes"
            :key="i"
            type="button"
            class="dp-day"
            :class="{
              'dp-day--empty':    !dia,
              'dp-day--selected': esSeleccionado(dia),
              'dp-day--today':    esHoy(dia),
              'dp-day--disabled': estaDeshabilitado(dia)
            }"
            :disabled="estaDeshabilitado(dia)"
            @click="seleccionarDia(dia)"
          >
            {{ dia || '' }}
          </button>
        </div>

        <!-- Vista: meses -->
        <div v-else-if="modoPicker === 'meses'" class="dp-months">
          <button
            v-for="(mes, i) in MESES"
            :key="i"
            type="button"
            class="dp-month-btn"
            :class="{ 'dp-month-btn--active': i === vistaM }"
            @click="seleccionarMes(i)"
          >
            {{ mes.slice(0, 3) }}
          </button>
        </div>

        <!-- Vista: años -->
        <div v-else-if="modoPicker === 'años'" class="dp-years">
          <button
            v-for="año in añosRango"
            :key="año"
            type="button"
            class="dp-year-btn"
            :class="{ 'dp-year-btn--active': año === vistaAño }"
            @click="seleccionarAño(año)"
          >
            {{ año }}
          </button>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dp-wrap { position: relative; width: 100%; }

/* ── Trigger ─────────────────────────────────────────────────── */
.dp-trigger {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.78rem 1rem;
  background: var(--color-surface-alt);
  border: 1.5px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
  min-height: 48px;
}
.dp-trigger:hover { background: var(--color-surface-warm); }
.dp-trigger--open {
  border-color: var(--color-teal);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(124,203,194,0.18);
}

.dp-icon { color: var(--color-teal); flex-shrink: 0; }

.dp-value    { font-size: 0.9375rem; color: var(--color-text); flex: 1; }
.dp-placeholder { font-size: 0.9375rem; color: var(--color-text-muted); flex: 1; }

.dp-clear {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--color-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
.dp-clear:hover { background: var(--color-danger-light); color: var(--color-danger); }

/* ── Calendario ──────────────────────────────────────────────── */
.dp-calendar {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 500;
  padding: 1rem;
  width: 280px;
  border: 1px solid var(--color-border);
}

/* Header */
.dp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.dp-header-labels {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.dp-header-btn {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.dp-header-btn:hover { background: var(--color-surface-alt); }

.dp-nav-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-soft);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.dp-nav-btn:hover { background: var(--color-surface-alt); color: var(--color-text); }

/* Grid días */
.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dp-weekday {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.25rem 0 0.4rem;
}

.dp-day {
  height: 32px;
  width: 100%;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--color-text-soft);
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast);
  font-family: var(--font-body);
}
.dp-day:not(.dp-day--empty):not(.dp-day--disabled):hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}
.dp-day--today {
  font-weight: 700;
  color: var(--color-primary);
}
.dp-day--selected {
  background: var(--color-primary) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(240,130,99,0.35);
}
.dp-day--disabled { opacity: 0.3; cursor: not-allowed; }
.dp-day--empty    { pointer-events: none; }

/* Meses */
.dp-months {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.dp-month-btn {
  padding: 0.5rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-soft);
  transition: background var(--transition-fast), color var(--transition-fast);
  text-align: center;
}
.dp-month-btn:hover     { background: var(--color-surface-alt); color: var(--color-text); }
.dp-month-btn--active   { background: var(--color-primary-light); color: var(--color-primary-dark); font-weight: 700; }

/* Años */
.dp-years {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.dp-year-btn {
  padding: 0.5rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-soft);
  transition: background var(--transition-fast), color var(--transition-fast);
  text-align: center;
}
.dp-year-btn:hover   { background: var(--color-surface-alt); color: var(--color-text); }
.dp-year-btn--active { background: var(--color-primary-light); color: var(--color-primary-dark); font-weight: 700; }

/* Animación */
.dp-drop-enter-active,
.dp-drop-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
  transform-origin: top left;
}
.dp-drop-enter-from,
.dp-drop-leave-to {
  opacity: 0;
  transform: scaleY(0.94) translateY(-4px);
}
</style>
