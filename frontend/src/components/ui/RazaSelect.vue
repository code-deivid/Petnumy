<!-- src/components/ui/RazaSelect.vue -->
<!-- Selector de raza searchable custom — estilo Petnumy premium -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: String, default: '' },
  razas:      { type: Array,  default: () => [] },
  disabled:   { type: Boolean, default: false },
  placeholder:{ type: String, default: '' },
  hasError:   { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])
const { t, locale } = useI18n()

function nombreRaza(raza = {}) {
  const nombre = raza.nombre || raza.raza || ''
  if (locale.value === 'es') return nombre
  const key = String(nombre).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const mapEn = {
    'afgano': 'Afghan Hound',
    'akita japones': 'Japanese Akita',
    'schnauzer estandar': 'Standard Schnauzer',
    'galgo espanol': 'Spanish Greyhound',
    'pastor aleman': 'German Shepherd',
    'perro de agua espanol': 'Spanish Water Dog',
    'podenco ibicenco': 'Ibizan Hound',
    'bichon maltes': 'Maltese',
    'bulldog frances': 'French Bulldog'
  }
  const mapVa = {
    'afgano': 'Afganés',
    'akita japones': 'Akita japonés',
    'schnauzer estandar': 'Schnauzer estàndard',
    'galgo espanol': 'Galg espanyol',
    'pastor aleman': 'Pastor alemany',
    'perro de agua espanol': 'Gos d’aigua espanyol',
    'podenco ibicenco': 'Podenc eivissenc',
    'bichon maltes': 'Bichon maltés',
    'bulldog frances': 'Bulldog francés'
  }
  return (locale.value === 'en' ? mapEn[key] : mapVa[key]) || nombre
}

const abierto    = ref(false)
const busqueda   = ref('')
const inputRef   = ref(null)
const wrapRef    = ref(null)
const listRef    = ref(null)
const highlighted = ref(-1)

// Raza seleccionada actualmente
const seleccionada = computed(() =>
  props.razas.find(r => r.id === props.modelValue) || null
)

// Filtrar razas por búsqueda
const razasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return props.razas
  return props.razas.filter(r => `${r.nombre || ''} ${nombreRaza(r)}`.toLowerCase().includes(q))
})

function abrir() {
  if (props.disabled) return
  abierto.value  = true
  busqueda.value = ''
  highlighted.value = -1
  nextTick(() => inputRef.value?.focus())
}

function cerrar() {
  abierto.value  = false
  busqueda.value = ''
}

function seleccionar(raza) {
  emit('update:modelValue', raza.id)
  cerrar()
}

function limpiar(e) {
  e.stopPropagation()
  emit('update:modelValue', '')
}

// Navegación por teclado
function onKeydown(e) {
  if (!abierto.value) return
  const total = razasFiltradas.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlighted.value = (highlighted.value + 1) % total
    scrollToHighlighted()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlighted.value = (highlighted.value - 1 + total) % total
    scrollToHighlighted()
  } else if (e.key === 'Enter' && highlighted.value >= 0) {
    e.preventDefault()
    seleccionar(razasFiltradas.value[highlighted.value])
  } else if (e.key === 'Escape') {
    cerrar()
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const el = listRef.value?.querySelector('.raza-option--highlighted')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

// Cerrar al click fuera
function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) cerrar()
}

onMounted(()    => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

// Resetear highlight cuando cambia la búsqueda
watch(busqueda, () => { highlighted.value = -1 })
</script>

<template>
  <div class="rs-wrap" ref="wrapRef" :class="{ 'rs-wrap--disabled': disabled }">

    <!-- Trigger -->
    <div
      class="rs-trigger"
      :class="{
        'rs-trigger--open':   abierto,
        'rs-trigger--error':  hasError,
        'rs-trigger--filled': !!modelValue
      }"
      @click="abrir"
      role="combobox"
      :aria-expanded="abierto"
    >
      <span v-if="seleccionada" class="rs-selected">{{ nombreRaza(seleccionada) }}</span>
      <span v-else class="rs-placeholder">{{ placeholder }}</span>

      <div class="rs-icons">
        <!-- X para limpiar -->
        <button
          v-if="modelValue"
          class="rs-clear"
          type="button"
          @click.stop="limpiar"
          tabindex="-1"
          :aria-label="t('common.delete')"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <!-- Chevron -->
        <svg
          class="rs-chevron"
          :class="{ 'rs-chevron--up': abierto }"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <!-- Dropdown flotante -->
    <Transition name="rs-drop">
      <div v-if="abierto" class="rs-dropdown">

        <!-- Búsqueda -->
        <div class="rs-search-wrap">
          <svg class="rs-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref="inputRef"
            v-model="busqueda"
            type="text"
            class="rs-search-input"
            :placeholder="placeholder || t('pets.searchBreed')"
            @keydown="onKeydown"
          />
        </div>

        <!-- Lista -->
        <div class="rs-list" ref="listRef">
          <div v-if="razasFiltradas.length === 0" class="rs-empty">
            {{ t("common.noResults") }}: "{{ busqueda }}"
          </div>
          <button
            v-for="(raza, i) in razasFiltradas"
            :key="raza.id"
            type="button"
            class="raza-option"
            :class="{
              'raza-option--selected':     raza.id === modelValue,
              'raza-option--highlighted':  i === highlighted
            }"
            @click="seleccionar(raza)"
            @mouseenter="highlighted = i"
          >
            <span class="raza-option-name">{{ nombreRaza(raza) }}</span>
            <!-- Checkmark si está seleccionada -->
            <svg v-if="raza.id === modelValue" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        </div>

        <!-- Contador -->
        <div v-if="razasFiltradas.length > 0" class="rs-footer">
          {{ razasFiltradas.length }} {{ razasFiltradas.length === 1 ? t('pets.breed').toLowerCase() : t('pets.breeds').toLowerCase() }}
        </div>

      </div>
    </Transition>

  </div>
</template>

<style scoped>
.rs-wrap {
  position: relative;
  width: 100%;
}

.rs-wrap--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ── Trigger ─────────────────────────────────────────────────── */
.rs-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.78rem 1rem;
  background: var(--color-surface-alt);
  border: 1.5px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
  min-height: 48px;
}

.rs-trigger:hover { background: var(--color-surface-warm); }

.rs-trigger--open {
  border-color: var(--color-teal);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(124,203,194,0.18);
}

.rs-trigger--error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(217,95,95,0.12);
}

.rs-selected {
  font-size: 0.9375rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.rs-placeholder {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  flex: 1;
}

.rs-icons {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.rs-clear {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--color-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.rs-clear:hover { background: var(--color-danger-light); color: var(--color-danger); }

.rs-chevron {
  color: var(--color-text-muted);
  transition: transform var(--transition-normal);
}
.rs-chevron--up { transform: rotate(180deg); }

/* ── Dropdown ────────────────────────────────────────────────── */
.rs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 500;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

/* Búsqueda */
.rs-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
}

.rs-search-icon { color: var(--color-text-muted); flex-shrink: 0; }

.rs-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--color-text);
  outline: none;
  font-family: var(--font-body);
}
.rs-search-input::placeholder { color: var(--color-text-muted); }

/* Lista scrollable */
.rs-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 0.35rem;

  /* Scrollbar custom */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.rs-list::-webkit-scrollbar       { width: 4px; }
.rs-list::-webkit-scrollbar-track { background: transparent; }
.rs-list::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }

/* Opción */
.raza-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  text-align: left;
  font-size: 0.875rem;
  color: var(--color-text-soft);
  transition: background var(--transition-fast), color var(--transition-fast);
  cursor: pointer;
  border: none;
  background: transparent;
  font-family: var(--font-body);
}

.raza-option:hover,
.raza-option--highlighted {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.raza-option--selected {
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
  font-weight: 600;
}

.raza-option--selected svg { color: var(--color-teal); }

.raza-option-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Empty */
.rs-empty {
  padding: 1.25rem;
  text-align: center;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Footer contador */
.rs-footer {
  padding: 0.4rem 0.85rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-align: right;
  font-family: var(--font-display);
  font-weight: 600;
}

/* ── Transición del dropdown ─────────────────────────────────── */
.rs-drop-enter-active,
.rs-drop-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
  transform-origin: top center;
}
.rs-drop-enter-from,
.rs-drop-leave-to {
  opacity: 0;
  transform: scaleY(0.94) translateY(-4px);
}
</style>
