<!-- src/components/vacunas/ModalAddVacuna.vue -->
<!-- Modal premium para añadir vacuna — cards seleccionables por especie -->
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useApi } from '@/composables/useApi.js'
import { getVacunaInfo } from '@/data/vacunasInfo.js'

const props = defineProps({
  visible:   { type: Boolean, default: false },
  mascota:   { type: Object,  default: null  },  // necesitamos especie
  mascotaId: { type: String,  default: ''    }
})
const emit = defineEmits(['close', 'added'])

const { get, post } = useApi()

// ── Estado ────────────────────────────────────────────────────
const catalogo      = ref([])
const loadingCat    = ref(false)
const guardando     = ref(false)
const errorMsg      = ref(null)
const vacunaSeleccionada = ref(null)   // objeto vacuna del catálogo
const paso          = ref(1)           // 1: seleccionar vacuna, 2: rellenar datos

const form = ref({
  estado:             'puesta',
  fecha_aplicacion:   '',
  proxima_aplicacion: ''
})

// ── Computados ────────────────────────────────────────────────
const idEspecie = computed(() => props.mascota?.raza?.especie?.id || null)

// Catálogo enriquecido con info local
const catalogoEnriquecido = computed(() =>
  catalogo.value.map(v => ({
    ...v,
    info: getVacunaInfo(v.nombre)
  }))
)

// ── Cargar catálogo por especie ───────────────────────────────
async function cargarCatalogo() {
  if (!idEspecie.value) return
  loadingCat.value = true
  const params = idEspecie.value ? `?id_especie=${idEspecie.value}` : ''
  const { ok, data } = await get(`/api/vacunas${params}`)
  loadingCat.value = false
  if (ok && data.vacunas) catalogo.value = data.vacunas
}

watch(() => props.visible, (v) => {
  if (v) {
    reset()
    cargarCatalogo()
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function reset() {
  paso.value = 1
  vacunaSeleccionada.value = null
  errorMsg.value = null
  form.value = { estado: 'puesta', fecha_aplicacion: '', proxima_aplicacion: '' }
}

function seleccionar(v) {
  vacunaSeleccionada.value = v
  // Auto fecha de hoy si estado es "puesta"
  if (form.value.estado === 'puesta' && !form.value.fecha_aplicacion) {
    form.value.fecha_aplicacion = new Date().toISOString().split('T')[0]
  }
  paso.value = 2
}

function volver() { paso.value = 1; errorMsg.value = null }

// ── Guardar ───────────────────────────────────────────────────
async function guardar() {
  if (!vacunaSeleccionada.value) return
  errorMsg.value = null

  if (form.value.estado === 'puesta' && !form.value.fecha_aplicacion) {
    errorMsg.value = 'Indica la fecha en que se administró la vacuna'
    return
  }

  guardando.value = true
  const body = {
    id_vacuna:          vacunaSeleccionada.value.id,
    estado:             form.value.estado,
    fecha_aplicacion:   form.value.fecha_aplicacion    || null,
    proxima_aplicacion: form.value.proxima_aplicacion  || null
  }

  const { ok, data } = await post(`/api/mascotas/${props.mascotaId}/vacunas`, body)
  guardando.value = false

  if (!ok) {
    errorMsg.value = data.message || 'Error al guardar la vacuna'
    return
  }

  emit('added', data.vacuna)
  emit('close')
}

// Fecha mínima para próxima dosis = hoy
const hoy = new Date().toISOString().split('T')[0]
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="mav-overlay" @click.self="$emit('close')">
      <Transition name="modal-slide">
        <div v-if="visible" class="mav-modal card">

          <!-- ── Cabecera ─────────────────────────────────── -->
          <div class="mav-header">
            <div class="mav-header-left">
              <div class="mav-header-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div>
                <h3 class="mav-title">Añadir Vacuna</h3>
                <p class="mav-sub">
                  {{ paso === 1
                    ? `Vacunas para ${mascota?.raza?.especie?.especie || 'tu mascota'}`
                    : vacunaSeleccionada?.nombre }}
                </p>
              </div>
            </div>
            <button type="button" class="mav-close" @click="$emit('close')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- ── Paso 1: Seleccionar vacuna ──────────────── -->
          <div v-if="paso === 1" class="mav-body">

            <!-- Loading catálogo -->
            <div v-if="loadingCat" class="mav-loading">
              <div class="mav-ske" v-for="i in 4" :key="i" />
            </div>

            <!-- Sin catálogo -->
            <div v-else-if="catalogo.length === 0" class="mav-empty">
              <p>No hay vacunas disponibles para esta especie.</p>
            </div>

            <!-- Grid de cards de vacuna -->
            <div v-else class="mav-grid">
              <button type="button"
                v-for="v in catalogoEnriquecido"
                :key="v.id"
                class="mav-card"
                :class="{ 'mav-card--sel': vacunaSeleccionada?.id === v.id }"
                @click="seleccionar(v)"
              >
                <div class="mav-card-icon">
                  <span v-if="v.info?.icon" class="mav-card-emoji">{{ v.info.icon }}</span>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div class="mav-card-info">
                  <span class="mav-card-nombre">{{ v.nombre }}</span>
                  <span class="mav-card-desc">{{ v.info?.descripcionCorta || v.descripcion || '' }}</span>
                </div>
                <svg v-if="vacunaSeleccionada?.id === v.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="mav-card-check">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>

          </div>

          <!-- ── Paso 2: Rellenar datos ──────────────────── -->
          <div v-else-if="paso === 2" class="mav-body">

            <!-- Vacuna elegida (resumen) -->
            <div class="mav-elegida">
              <span class="mav-elegida-emoji">{{ vacunaSeleccionada?.info?.icon || '💉' }}</span>
              <div>
                <p class="mav-elegida-nombre">{{ vacunaSeleccionada?.nombre }}</p>
                <p class="mav-elegida-desc">{{ vacunaSeleccionada?.info?.descripcionCorta || vacunaSeleccionada?.descripcion }}</p>
              </div>
            </div>

            <!-- Error -->
            <Transition name="fade">
              <div v-if="errorMsg" class="msg msg-error">{{ errorMsg }}</div>
            </Transition>

            <!-- Estado -->
            <div class="input-group">
              <label class="label">Estado *</label>
              <div class="mav-estado-btns">
                <button
                  v-for="e in [
                    { val: 'puesta',    label: 'Puesta / Completada', color: 'teal'   },
                    { val: 'pendiente', label: 'Pendiente',           color: 'yellow' },
                    { val: 'retrasada', label: 'Atrasada',            color: 'red'    }
                  ]"
                  :key="e.val"
                  type="button"
                  :class="['mav-estado-btn', `mav-estado-btn--${e.color}`, { 'mav-estado-btn--on': form.estado === e.val }]"
                  @click="form.estado = e.val"
                >{{ e.label }}</button>
              </div>
            </div>

            <!-- Fecha administrada -->
            <div class="input-group">
              <label class="label">Fecha administrada{{ form.estado === 'puesta' ? ' *' : '' }}</label>
              <input
                v-model="form.fecha_aplicacion"
                type="date"
                class="input"
                :max="hoy"
              />
            </div>

            <!-- Próxima dosis -->
            <div class="input-group">
              <label class="label">Próxima dosis</label>
              <input
                v-model="form.proxima_aplicacion"
                type="date"
                class="input"
                :min="hoy"
              />
              <span class="input-hint">Deja en blanco si no aplica o no sabes la fecha.</span>
            </div>

          </div>

          <!-- ── Footer con botones ──────────────────────── -->
          <div class="mav-footer">
            <button type="button"
              class="btn btn-ghost"
              @click="paso === 1 ? $emit('close') : volver()"
            >
              {{ paso === 1 ? 'Cancelar' : '← Volver' }}
            </button>
            <button type="button"
              v-if="paso === 2"
              class="btn btn-teal"
              :disabled="guardando"
              @click="guardar"
            >
              <span v-if="guardando" class="spinner" style="width:14px;height:14px;border-width:2px"/>
              <span v-else>Guardar vacuna</span>
            </button>
          </div>

        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* Overlay */
.mav-overlay {
  position: fixed; inset: 0;
  background: rgba(30, 20, 14, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

/* Modal */
.mav-modal {
  width: 100%; max-width: 520px;
  max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

/* Header */
.mav-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem; flex-shrink: 0;
}
.mav-header-left  { display: flex; align-items: center; gap: 0.75rem; }
.mav-header-icon  { width: 34px; height: 34px; border-radius: var(--radius-sm); background: var(--color-teal-light); color: var(--color-teal-dark); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mav-title { font-size: 1rem; margin: 0; }
.mav-sub   { font-size: 0.78rem; color: var(--color-text-muted); margin: 0; }
.mav-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--color-surface-alt); color: var(--color-text-soft);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background var(--transition-fast), color var(--transition-fast);
}
.mav-close:hover { background: var(--color-danger-light); color: var(--color-danger); }

/* Body scrollable */
.mav-body {
  flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; gap: 1rem;
}

/* Loading skeletons */
.mav-loading { display: flex; flex-direction: column; gap: 0.6rem; }
.mav-ske {
  height: 64px; border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  animation: _pulse 1.5s ease-in-out infinite;
}
@keyframes _pulse { 0%,100%{opacity:1} 50%{opacity:.45} }

/* Empty */
.mav-empty { text-align: center; padding: 2rem; color: var(--color-text-muted); font-size: 0.875rem; }

/* Grid de cards de vacuna */
.mav-grid { display: flex; flex-direction: column; gap: 0.5rem; }

.mav-card {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer; text-align: left; width: 100%;
  transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
}
.mav-card:hover {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
  transform: translateX(3px);
}
.mav-card--sel {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
}

.mav-card-icon {
  width: 40px; height: 40px; border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 1.2rem;
}
.mav-card-emoji { font-size: 1.1rem; }

.mav-card-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
.mav-card-nombre { font-family: var(--font-display); font-weight: 700; font-size: 0.875rem; color: var(--color-text); }
.mav-card-desc   { font-size: 0.72rem; color: var(--color-text-muted); }
.mav-card-check  { color: var(--color-teal-dark); flex-shrink: 0; }

/* Paso 2 — Vacuna elegida */
.mav-elegida {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--color-teal-light);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-teal-mid);
}
.mav-elegida-emoji  { font-size: 1.4rem; flex-shrink: 0; }
.mav-elegida-nombre { font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; color: var(--color-text); margin: 0 0 0.15rem; }
.mav-elegida-desc   { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }

/* Botones estado */
.mav-estado-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.mav-estado-btn {
  padding: 0.45rem 1rem; border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-alt);
  font-family: var(--font-display); font-weight: 600; font-size: 0.8rem;
  cursor: pointer; transition: all var(--transition-fast);
  color: var(--color-text-soft);
}
.mav-estado-btn--teal.mav-estado-btn--on   { border-color: var(--color-teal);    background: var(--color-teal-light);    color: var(--color-teal-dark); }
.mav-estado-btn--yellow.mav-estado-btn--on { border-color: #D4A017;              background: #FEF9E7;                    color: #9A6A10; }
.mav-estado-btn--red.mav-estado-btn--on    { border-color: var(--color-danger);  background: var(--color-danger-light);  color: var(--color-danger); }

/* Footer */
.mav-footer {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* Animaciones */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity var(--transition-normal); }
.modal-fade-enter-from, .modal-fade-leave-to       { opacity: 0; }
.modal-slide-enter-active, .modal-slide-leave-active { transition: opacity var(--transition-normal), transform var(--transition-normal); }
.modal-slide-enter-from, .modal-slide-leave-to       { opacity: 0; transform: scale(0.96) translateY(12px); }

/* Responsive */
@media (max-width: 540px) {
  .mav-modal { max-height: 92vh; border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  .mav-overlay { align-items: flex-end; padding: 0; }
  .mav-estado-btns { flex-direction: column; }
}
</style>
