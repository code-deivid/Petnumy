<!-- src/pages/MisCitasPage.vue -->
<!-- Historial de citas reservadas. NO crea citas — solo las muestra. -->
<!-- Las citas se crean desde Veterinarios → detalle de clínica → Reservar -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'

const router          = useRouter()
const { get, patch }  = useApi()
const { t } = useI18n()

const citas   = ref([])
const loading = ref(false)
const error   = ref(null)

// ── Separar por estado ────────────────────────────────────────
const proximas = computed(() =>
  citas.value
    .filter(c => ['pendiente', 'confirmada'].includes(c.estado))
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
)
const historial = computed(() =>
  citas.value
    .filter(c => ['completada', 'cancelada'].includes(c.estado))
    .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
)

async function cargarCitas() {
  loading.value = true
  error.value   = null
  const { ok, data } = await get('/api/citas')
  loading.value = false
  if (!ok) { error.value = data.message || 'Error al cargar las citas'; return }
  citas.value = data.citas || []
}

// ── Cancelar cita ─────────────────────────────────────────────
const cancelando = ref(null) // id de la cita que se está cancelando
const confirmCancelar = ref(null) // id para confirmar

function pedirCancelar(cita) {
  confirmCancelar.value = cita.id
}

async function ejecutarCancelar(cita) {
  cancelando.value = cita.id
  confirmCancelar.value = null
  const { ok, data } = await patch(`/api/citas/${cita.id}/cancelar`, {})
  cancelando.value = null
  if (!ok) { alert(data.message || 'No se pudo cancelar la cita'); return }
  const idx = citas.value.findIndex(c => c.id === cita.id)
  if (idx !== -1) citas.value[idx] = { ...citas.value[idx], ...data.cita }
}

// ── Helpers ───────────────────────────────────────────────────
function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}
function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
function getDia(iso)  { return new Date(iso).getDate() }
function getMes(iso)  { return new Date(iso).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() }

// Devuelve el nombre de la clínica — funciona tanto para citas directas
// (tienen c.clinica) como para citas con veterinario (tienen c.veterinario.clinica)
function getNombreClinica(cita) {
  if (cita.clinica?.nombre)                  return cita.clinica.nombre
  if (cita.veterinario?.clinica?.nombre)     return cita.veterinario.clinica.nombre
  return null
}

// Devuelve el motivo / servicio como texto visible
function getDescripcion(cita) {
  if (cita.motivo)           return cita.motivo
  if (cita.servicio?.nombre) return cita.servicio.nombre
  return 'Consulta veterinaria'
}

// Devuelve el veterinario si lo hay
function getNombreVet(cita) {
  if (!cita.veterinario) return null
  const { nombre, apellidos } = cita.veterinario
  return [nombre, apellidos].filter(Boolean).join(' ')
}

const BADGE_COLOR = computed(() => ({
  pendiente:  { bg: '#FFF3E0', color: '#E65100', label: t('appointments.status.pendiente') },
  confirmada: { bg: '#E0F1EE', color: '#4AADA5', label: t('appointments.status.confirmada') },
  completada: { bg: '#E8F0FC', color: '#3A5FA0', label: t('appointments.status.completada') },
  cancelada:  { bg: '#FDEAEA', color: '#D95F5F', label: t('appointments.status.cancelada') },
}))

onMounted(cargarCitas)
</script>

<template>
  <div class="page-container page-section">

    <!-- ── Cabecera ─────────────────────────────────────────── -->
    <div class="mc-head">
      <div>
        <h1 class="mc-titulo">{{ t("appointments.title") }}</h1>
        <p class="mc-sub">{{ t("appointments.subtitle") }}</p>
      </div>
    </div>

    <!-- ── Cargando ─────────────────────────────────────────── -->
    <div v-if="loading" style="display:flex;justify-content:center;padding:4rem 0">
      <div class="spinner" />
    </div>

    <!-- ── Error ────────────────────────────────────────────── -->
    <div v-else-if="error" class="msg msg-error" style="margin-top:1rem">
      {{ error }}
      <button type="button" class="btn btn-outline btn-sm" style="margin-left:1rem" @click="cargarCitas">
        Reintentar
      </button>
    </div>

    <template v-else>

      <!-- ── Sin citas ─────────────────────────────────────── -->
      <div v-if="citas.length === 0" class="mc-empty card">
        <div class="mc-empty-icon">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h3 class="mc-empty-titulo">{{ t("appointments.empty") }}</h3>
        <p class="mc-empty-desc">
          {{ t("appointments.emptyDesc") }}
        </p>
        <button type="button" class="btn btn-teal" @click="router.push({ name: 'clinicas' })">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {{ t("appointments.viewVets") }}
        </button>
      </div>

      <template v-else>

        <!-- ── Próximas citas ──────────────────────────────── -->
        <section v-if="proximas.length > 0" class="mc-section">
          <h2 class="mc-section-label">{{ t("appointments.upcoming") }}</h2>
          <div class="mc-lista">
            <div
              v-for="cita in proximas"
              :key="cita.id"
              class="mc-card card card-animate mc-card--proxima"
            >
              <div class="mc-card-inner">

                <!-- Fecha -->
                <div class="mc-fecha">
                  <span class="mc-dia">{{ getDia(cita.fecha_hora) }}</span>
                  <span class="mc-mes">{{ getMes(cita.fecha_hora) }}</span>
                  <span class="mc-hora">{{ formatHora(cita.fecha_hora) }}</span>
                </div>

                <!-- Info -->
                <div class="mc-info">
                  <div class="mc-info-row1">
                    <span class="mc-mascota">{{ cita.mascota?.nombre || '—' }}</span>
                    <span
                      class="mc-badge"
                      :style="{ background: BADGE_COLOR[cita.estado]?.bg, color: BADGE_COLOR[cita.estado]?.color }"
                    >{{ BADGE_COLOR[cita.estado]?.label }}</span>
                  </div>
                  <p class="mc-descripcion">{{ getDescripcion(cita) }}</p>
                  <p v-if="getNombreClinica(cita)" class="mc-clinica">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ getNombreClinica(cita) }}
                    <template v-if="getNombreVet(cita)">
                      · Dr. {{ getNombreVet(cita) }}
                    </template>
                  </p>
                </div>

                <!-- Cancelar -->
                <div class="mc-accion">
                  <template v-if="confirmCancelar === cita.id">
                    <div class="mc-confirm">
                      <p class="mc-confirm-txt">{{ t("appointments.cancelQuestion") }}</p>
                      <div style="display:flex;gap:0.4rem">
                        <button type="button" class="btn btn-ghost btn-sm" @click="confirmCancelar = null">{{ t("common.no") }}</button>
                        <button type="button" class="btn btn-sm mc-btn-cancelar-confirm" @click="ejecutarCancelar(cita)">
                          <span v-if="cancelando === cita.id" class="spinner" style="width:12px;height:12px;border-width:2px"/>
                          <span v-else>{{ t("appointments.cancelYes") }}</span>
                        </button>
                      </div>
                    </div>
                  </template>
                  <button
                    v-else
                    type="button"
                    class="mc-btn-cancelar"
                    :disabled="cancelando === cita.id"
                    @click="pedirCancelar(cita)"
                  >
                    <span v-if="cancelando === cita.id" class="spinner" style="width:12px;height:12px;border-width:2px"/>
                    <span v-else>{{ t("appointments.cancelBtn") }}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        <!-- ── Historial ──────────────────────────────────── -->
        <section v-if="historial.length > 0" class="mc-section">
          <h2 class="mc-section-label">{{ t("appointments.history") }}</h2>
          <div class="mc-lista">
            <div
              v-for="cita in historial"
              :key="cita.id"
              class="mc-card card mc-card--historial"
            >
              <div class="mc-card-inner">

                <div class="mc-fecha mc-fecha--muted">
                  <span class="mc-dia">{{ getDia(cita.fecha_hora) }}</span>
                  <span class="mc-mes">{{ getMes(cita.fecha_hora) }}</span>
                  <span class="mc-hora">{{ formatHora(cita.fecha_hora) }}</span>
                </div>

                <div class="mc-info">
                  <div class="mc-info-row1">
                    <span class="mc-mascota">{{ cita.mascota?.nombre || '—' }}</span>
                    <span
                      class="mc-badge"
                      :style="{ background: BADGE_COLOR[cita.estado]?.bg, color: BADGE_COLOR[cita.estado]?.color }"
                    >{{ BADGE_COLOR[cita.estado]?.label }}</span>
                  </div>
                  <p class="mc-descripcion">{{ getDescripcion(cita) }}</p>
                  <p v-if="getNombreClinica(cita)" class="mc-clinica">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ getNombreClinica(cita) }}
                    <template v-if="getNombreVet(cita)">
                      · Dr. {{ getNombreVet(cita) }}
                    </template>
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

      </template>
    </template>

  </div>
</template>

<style scoped>
/* ── Cabecera ────────────────────────────────────────────────── */
.mc-head { margin-bottom: 1.75rem; }
.mc-titulo {
  font-family: var(--font-display); font-weight: 800;
  font-size: clamp(1.5rem, 4vw, 2rem); color: var(--color-text); margin: 0;
}
.mc-sub { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--color-text-muted); }

/* ── Estado vacío ────────────────────────────────────────────── */
.mc-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; text-align: center;
  padding: 3.5rem 2rem;
}
.mc-empty-icon {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--color-surface-alt);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
}
.mc-empty-titulo {
  font-family: var(--font-display); font-weight: 700;
  font-size: 1.05rem; color: var(--color-text); margin: 0;
}
.mc-empty-desc {
  font-size: 0.875rem; color: var(--color-text-muted);
  max-width: 340px; line-height: 1.5; margin: 0;
}
.mc-empty .btn {
  display: inline-flex; align-items: center; gap: 0.45rem; margin-top: 0.5rem;
}

/* ── Secciones ───────────────────────────────────────────────── */
.mc-section { margin-bottom: 2.25rem; }
.mc-section-label {
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--color-text-muted); margin: 0 0 0.75rem;
}
.mc-lista { display: flex; flex-direction: column; gap: 0.65rem; }

/* ── Card de cita ────────────────────────────────────────────── */
.mc-card {
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.mc-card--proxima { border-left: 3px solid var(--color-primary); }
.mc-card--historial { opacity: 0.72; }
.mc-card--historial:hover { opacity: 1; }

.mc-card-inner {
  display: flex; align-items: flex-start; gap: 1rem;
  padding: 1.1rem 1.25rem;
}

/* Columna fecha */
.mc-fecha {
  display: flex; flex-direction: column; align-items: center;
  min-width: 50px; flex-shrink: 0;
  background: var(--color-primary-light); border-radius: var(--radius-md);
  padding: 0.5rem 0.4rem;
}
.mc-fecha--muted { background: var(--color-surface-alt); }

.mc-dia  { font-family: var(--font-display); font-weight: 800; font-size: 1.35rem; line-height: 1; color: var(--color-primary); }
.mc-mes  { font-family: var(--font-display); font-weight: 700; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
.mc-hora { font-family: var(--font-display); font-weight: 600; font-size: 0.7rem; color: var(--color-text-soft); margin-top: 0.15rem; }
.mc-fecha--muted .mc-dia { color: var(--color-text-muted); }

/* Info */
.mc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
.mc-info-row1 { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.mc-mascota {
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.95rem; color: var(--color-text);
}
.mc-badge {
  font-family: var(--font-display); font-weight: 700; font-size: 0.62rem;
  letter-spacing: 0.3px; padding: 0.15rem 0.55rem; border-radius: var(--radius-full);
}
.mc-descripcion { font-size: 0.83rem; color: var(--color-text-soft); margin: 0; }
.mc-clinica {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.75rem; color: var(--color-text-muted); margin: 0;
}
.mc-clinica svg { flex-shrink: 0; }

/* Acción cancelar */
.mc-accion { flex-shrink: 0; display: flex; align-items: flex-start; }
.mc-btn-cancelar {
  font-family: var(--font-display); font-weight: 600; font-size: 0.75rem;
  color: var(--color-danger); background: none; border: 1px solid transparent;
  border-radius: var(--radius-full); padding: 0.35rem 0.75rem; cursor: pointer;
  opacity: 0.7; transition: all var(--transition-fast);
  display: flex; align-items: center; gap: 0.3rem;
}
.mc-btn-cancelar:hover:not(:disabled) {
  opacity: 1; background: var(--color-danger-light);
  border-color: var(--color-danger);
}
.mc-btn-cancelar:disabled { opacity: 0.4; cursor: not-allowed; }

.mc-confirm { display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; }
.mc-confirm-txt { font-size: 0.72rem; color: var(--color-text-muted); white-space: nowrap; margin: 0; }
.mc-btn-cancelar-confirm {
  background: var(--color-danger); color: #fff;
  font-family: var(--font-display); font-weight: 700;
  border-radius: var(--radius-full); border: none;
  display: flex; align-items: center; gap: 0.3rem;
}
.mc-btn-cancelar-confirm:hover { background: #c44; }

/* Responsive */
@media (max-width: 540px) {
  .mc-card-inner { padding: 0.9rem 1rem; gap: 0.75rem; }
  .mc-accion { display: none; }
  .mc-card--proxima { cursor: pointer; }
}
</style>
