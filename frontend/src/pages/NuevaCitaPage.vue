<!-- src/pages/NuevaCitaPage.vue -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'

const router       = useRouter()
const { get, post } = useApi()

// ── Estado del flujo ──────────────────────────────────────────
const paso      = ref(1)  // 1, 2 o 3
const loading   = ref(false)
const guardando = ref(false)
const error     = ref(null)

// Datos cargados
const clinicas     = ref([])
const veterinarios = ref([])
const servicios    = ref([])
const mascotas     = ref([])

// Selecciones del usuario
const clinicaSel   = ref(null)
const vetSel       = ref(null)
const servicioSel  = ref(null)
const mascotaSel   = ref(null)
const fechaHora    = ref('')
const notas        = ref('')

// Mínimo para el datetime-local (ahora mismo)
const fechaMin = computed(() => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
})

// ── Carga inicial ─────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  const [resClinicas, resMascotas] = await Promise.all([
    get('/api/clinicas'),
    get('/api/mascotas')
  ])
  loading.value = false

  if (resClinicas.ok) clinicas.value = resClinicas.data.clinicas
  if (resMascotas.ok) mascotas.value = resMascotas.data.mascotas
})

// ── Paso 1 → 2: elegir clínica ────────────────────────────────
async function elegirClinica(clinica) {
  clinicaSel.value  = clinica
  vetSel.value      = null
  servicioSel.value = null
  loading.value     = true

  const [resVets, resClinica] = await Promise.all([
    get(`/api/clinicas/${clinica.id}/veterinarios`),
    get(`/api/clinicas/${clinica.id}`)
  ])
  loading.value = false

  veterinarios.value = resVets.ok  ? resVets.data.veterinarios          : []
  servicios.value    = resClinica.ok ? (resClinica.data.clinica.servicios || []) : []

  paso.value = 2
}

// ── Paso 2 → 3: elegir vet y servicio ────────────────────────
const paso2Valido = computed(() => vetSel.value && servicioSel.value)

function irPaso3() {
  if (!paso2Valido.value) return
  paso.value = 3
}

// ── Paso 3: confirmar cita ────────────────────────────────────
const paso3Valido = computed(() => mascotaSel.value && fechaHora.value)
const formError   = ref(null)

async function confirmarCita() {
  formError.value = null

  if (!mascotaSel.value)  { formError.value = 'Selecciona una mascota'; return }
  if (!fechaHora.value)   { formError.value = 'Selecciona fecha y hora'; return }

  guardando.value = true

  const { ok, data } = await post('/api/citas', {
    id_mascota:     mascotaSel.value.id,
    id_veterinario: vetSel.value.id,
    id_servicio:    servicioSel.value.id,
    fecha_hora:     new Date(fechaHora.value).toISOString(),
    notas_usuario:  notas.value.trim() || undefined
  })

  guardando.value = false

  if (!ok) {
    formError.value = data.message || 'Error al crear la cita'
    return
  }

  router.push({ name: 'mis-citas' })
}

// ── Utilidades ────────────────────────────────────────────────
function volver() {
  if (paso.value > 1) paso.value--
  else router.back()
}

function formatPrecio(precio) {
  if (precio == null) return null
  return Number(precio).toFixed(2) + ' €'
}
</script>

<template>
  <div class="page-container page-section">

    <!-- Cabecera con progreso -->
    <div class="ncita-head">
      <button class="btn btn-ghost btn-sm back-btn" @click="volver">← Volver</button>
      <h1>Nueva cita</h1>

      <!-- Indicador de pasos -->
      <div class="steps flex items-center gap-2">
        <div v-for="n in 3" :key="n" :class="['step', { 'step--active': paso === n, 'step--done': paso > n }]">
          <span class="step-num">{{ paso > n ? '✓' : n }}</span>
          <span class="step-label">{{ ['Clínica', 'Servicio', 'Confirmar'][n - 1] }}</span>
        </div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="flex justify-center" style="padding: 3rem 0">
      <div class="spinner" />
    </div>

    <template v-else>

      <!-- ── PASO 1: Elegir clínica ─────────────────────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="paso === 1" key="paso1">
          <p class="paso-desc">Selecciona la clínica donde quieres ir</p>
          <div v-if="clinicas.length === 0" class="empty-state">
            <p>No hay clínicas disponibles</p>
          </div>
          <div v-else class="clinicas-grid">
            <button
              v-for="clinica in clinicas"
              :key="clinica.id"
              class="card card-hover clinica-item"
              @click="elegirClinica(clinica)"
            >
              <div class="card-body flex items-center gap-3">
                <div class="clinica-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="clinica-nombre">{{ clinica.nombre }}</span>
                  <span class="clinica-ciudad">{{ clinica.ciudad }}</span>
                </div>
                <svg class="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
          </div>
        </div>
      </Transition>

      <!-- ── PASO 2: Veterinario + servicio ─────────────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="paso === 2" key="paso2">
          <p class="paso-desc">Escoge veterinario y tipo de consulta en <strong>{{ clinicaSel?.nombre }}</strong></p>

          <div class="paso2-grid">

            <!-- Veterinarios -->
            <div>
              <p class="grupo-label">Veterinario</p>
              <div class="opciones-list">
                <button
                  v-for="vet in veterinarios"
                  :key="vet.id"
                  :class="['opcion-item card', { 'opcion-item--selected': vetSel?.id === vet.id }]"
                  @click="vetSel = vet"
                >
                  <div class="card-body flex items-center gap-3">
                    <div class="vet-avatar-sm">{{ (vet.nombre[0] || '') + (vet.apellidos?.[0] || '') }}</div>
                    <div class="flex flex-col gap-0">
                      <span class="opcion-nombre">{{ vet.nombre }} {{ vet.apellidos }}</span>
                      <span v-if="vet.especialidad" class="opcion-sub">{{ vet.especialidad }}</span>
                    </div>
                    <div v-if="vetSel?.id === vet.id" class="opcion-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                </button>
                <p v-if="veterinarios.length === 0" class="empty-sub">Sin veterinarios disponibles</p>
              </div>
            </div>

            <!-- Servicios -->
            <div>
              <p class="grupo-label">Servicio</p>
              <div class="opciones-list">
                <button
                  v-for="srv in servicios"
                  :key="srv.id"
                  :class="['opcion-item card', { 'opcion-item--selected': servicioSel?.id === srv.id }]"
                  @click="servicioSel = srv"
                >
                  <div class="card-body flex items-center gap-3">
                    <div class="flex flex-col gap-0" style="flex:1">
                      <span class="opcion-nombre">{{ srv.nombre }}</span>
                      <span class="opcion-sub">{{ srv.duracion_minutos }} min
                        <template v-if="formatPrecio(srv.precio)"> · {{ formatPrecio(srv.precio) }}</template>
                      </span>
                    </div>
                    <div v-if="servicioSel?.id === srv.id" class="opcion-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                </button>
                <p v-if="servicios.length === 0" class="empty-sub">Sin servicios disponibles</p>
              </div>
            </div>

          </div>

          <div class="paso-footer">
            <button class="btn btn-primary" :disabled="!paso2Valido" @click="irPaso3">
              Continuar →
            </button>
          </div>
        </div>
      </Transition>

      <!-- ── PASO 3: Mascota, fecha y confirmación ──────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="paso === 3" key="paso3">
          <p class="paso-desc">Elige tu mascota, fecha y hora</p>

          <!-- Resumen selección -->
          <div class="card resumen-card">
            <div class="card-body flex flex-col gap-1">
              <p class="resumen-titulo">Resumen</p>
              <p class="resumen-item"><strong>Clínica:</strong> {{ clinicaSel?.nombre }}</p>
              <p class="resumen-item"><strong>Veterinario:</strong> Dr. {{ vetSel?.nombre }} {{ vetSel?.apellidos }}</p>
              <p class="resumen-item"><strong>Servicio:</strong> {{ servicioSel?.nombre }} ({{ servicioSel?.duracion_minutos }} min)</p>
            </div>
          </div>

          <div class="paso3-form">

            <!-- Mascota -->
            <div class="input-group">
              <label class="label">Mascota *</label>
              <div class="mascotas-selector">
                <button
                  v-for="m in mascotas"
                  :key="m.id"
                  :class="['mascota-chip', { 'mascota-chip--selected': mascotaSel?.id === m.id }]"
                  @click="mascotaSel = m"
                >
                  {{ m.nombre }}
                </button>
                <p v-if="mascotas.length === 0" class="empty-sub">No tienes mascotas. <RouterLink :to="{ name: 'mis-mascotas' }" class="link-inline">Añade una primero</RouterLink></p>
              </div>
            </div>

            <!-- Fecha y hora -->
            <div class="input-group">
              <label class="label" for="fechaHora">Fecha y hora *</label>
              <input
                id="fechaHora"
                v-model="fechaHora"
                type="datetime-local"
                class="input"
                :min="fechaMin"
              />
            </div>

            <!-- Notas opcionales -->
            <div class="input-group">
              <label class="label" for="notas">Notas para el veterinario <span class="label-opt">(opcional)</span></label>
              <textarea
                id="notas"
                v-model="notas"
                class="input textarea"
                rows="3"
                placeholder="Describe brevemente el motivo de la consulta..."
              />
            </div>

            <!-- Error -->
            <Transition name="fade">
              <div v-if="formError" class="msg msg-error">{{ formError }}</div>
            </Transition>

            <button
              class="btn btn-primary btn-lg btn-block"
              :disabled="guardando || !paso3Valido"
              @click="confirmarCita"
            >
              <span v-if="guardando" class="spinner" style="width:16px;height:16px;border-width:2px"/>
              <span v-else>Confirmar cita</span>
            </button>

          </div>
        </div>
      </Transition>

    </template>
  </div>
</template>

<style scoped>
/* Cabecera */
.ncita-head { margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
.back-btn { align-self: flex-start; padding-left: 0; }

/* Pasos */
.steps { flex-wrap: wrap; gap: 0.5rem; }
.step {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.step--active { background: var(--color-primary); box-shadow: 0 3px 10px rgba(244,132,95,.35); }
.step--done   { background: var(--color-teal-light); }

.step-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,0.08);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; font-size: 0.72rem;
  color: var(--color-text);
}
.step--active .step-num { background: rgba(255,255,255,0.3); color: #fff; }
.step--done   .step-num { background: var(--color-teal); color: #fff; }

.step-label { font-family: var(--font-display); font-weight: 600; font-size: 0.8rem; color: var(--color-text-soft); }
.step--active .step-label { color: #fff; }

/* Descripción de paso */
.paso-desc { font-size: 0.9rem; color: var(--color-text-soft); margin-bottom: 1.25rem; }
.paso-desc strong { color: var(--color-text); }

/* Paso 1 — grid de clínicas */
.clinicas-grid { display: flex; flex-direction: column; gap: 0.65rem; }
.clinica-item { cursor: pointer; text-align: left; width: 100%; }
.clinica-icon {
  width: 38px; height: 38px; border-radius: var(--radius-sm);
  background: var(--color-primary-light); color: var(--color-primary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.clinica-nombre { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--color-text); }
.clinica-ciudad { font-size: 0.8rem; color: var(--color-text-muted); }

/* Paso 2 */
.paso2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.grupo-label { font-family: var(--font-display); font-weight: 700; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 0.65rem; }
.opciones-list { display: flex; flex-direction: column; gap: 0.5rem; }

.opcion-item { cursor: pointer; text-align: left; width: 100%; border: 2px solid transparent; transition: border-color var(--transition-fast); }
.opcion-item--selected { border-color: var(--color-teal); box-shadow: 0 0 0 3px rgba(92,200,192,.12); }
.opcion-item .card-body { padding: 0.85rem 1rem; }

.vet-avatar-sm {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--color-teal-light); color: var(--color-teal-dark);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; font-size: 0.75rem;
  flex-shrink: 0;
}
.opcion-nombre { font-family: var(--font-display); font-weight: 700; font-size: 0.875rem; color: var(--color-text); }
.opcion-sub    { font-size: 0.78rem; color: var(--color-text-muted); }
.opcion-check  { width: 24px; height: 24px; border-radius: 50%; background: var(--color-teal); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.paso-footer { margin-top: 1.75rem; display: flex; justify-content: flex-end; }
.empty-sub   { font-size: 0.85rem; color: var(--color-text-muted); padding: 0.5rem 0; }

/* Paso 3 */
.resumen-card { background: var(--color-surface-alt); box-shadow: none; margin-bottom: 1.5rem; }
.resumen-titulo { font-family: var(--font-display); font-weight: 700; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 0.35rem; }
.resumen-item { font-size: 0.875rem; color: var(--color-text-soft); margin: 0; }
.resumen-item strong { color: var(--color-text); }

.paso3-form { display: flex; flex-direction: column; gap: 1.1rem; }

/* Selector de mascotas */
.mascotas-selector { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.mascota-chip {
  padding: 0.5rem 1.1rem;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  font-family: var(--font-display); font-weight: 600; font-size: 0.875rem;
  color: var(--color-text-soft);
  transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
}
.mascota-chip:hover { border-color: var(--color-teal); color: var(--color-text); }
.mascota-chip--selected { border-color: var(--color-teal); background: var(--color-teal-light); color: var(--color-teal-dark); }

.label-opt { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--color-text-muted); }

.textarea { resize: vertical; min-height: 80px; border-radius: var(--radius-md); }
.link-inline { color: var(--color-primary); font-weight: 600; }

/* Responsive */
@media (max-width: 600px) {
  .paso2-grid { grid-template-columns: 1fr; gap: 1.25rem; }
  .steps .step-label { display: none; }
  .paso-footer .btn { width: 100%; justify-content: center; }
}
</style>
