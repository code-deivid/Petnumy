<!-- src/pages/MascotaDetallePage.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PetAvatar from '@/components/ui/PetAvatar.vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { getVacunaInfo, estadoConfig } from '@/data/vacunasInfo.js'
import ModalAddVacuna    from '@/components/vacunas/ModalAddVacuna.vue'
import ModalDetalleVacuna from '@/components/vacunas/ModalDetalleVacuna.vue'
import ReminderPopover    from '@/components/vacunas/ReminderPopover.vue'
import { useRecordatorios } from '@/composables/useRecordatorios.js'

const route  = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { get, patch, remove } = useApi()

const dateLocale = computed(() => locale.value === 'en' ? 'en-US' : (locale.value === 'va' ? 'ca-ES' : 'es-ES'))

function traducirEspecie(valor = '') {
  const v = String(valor).toLowerCase()
  if (v.includes('perro') || v.includes('dog') || v.includes('gos')) return t('common.dog')
  if (v.includes('gato') || v.includes('cat') || v.includes('gat')) return t('common.cat')
  return valor || ''
}

function traducirGenero(valor = '') {
  const v = String(valor).toLowerCase()
  if (v === 'macho' || v === 'male' || v === 'mascle') return t('common.male')
  if (v === 'hembra' || v === 'female' || v === 'femella') return t('common.female')
  return valor || ''
}

function traducirEstado(valor = '') {
  const v = String(valor).toLowerCase()
  if (v === 'puesta' || v === 'completada') return t('vaccines.statusDone')
  if (v === 'pendiente') return t('vaccines.statusPending')
  if (v === 'retrasada') return t('vaccines.statusLate')
  return valor || ''
}

function vacunaInfoDisplay(vac) {
  return getVacunaInfo(vac?.vacuna?.nombre, locale.value) || {}
}

const { getDeVacuna, cargar: cargarRecordatorios } = useRecordatorios()

// Estado del popover de recordatorio (un único popover, referenciado por vacuna)
const reminderVacId    = ref(null)   // id del vacuna_mascota con popover abierto
const reminderBtnRefs  = ref({})     // refs de botones campana para posición

const mascota        = ref(null)
const vacunas        = ref([])
const loading        = ref(true)
const loadingVacunas = ref(false)
const error          = ref(null)
// cargarDatos extrae el id de route.params en cada llamada,
// así funciona tanto en onMounted como en watch
async function cargarDatos() {
  const id = route.params.id
  if (!id) return

  loading.value = true
  error.value   = null
  mascota.value = null
  vacunas.value = []

  const { ok, data } = await get(`/api/mascotas/${id}`)
  loading.value = false
  if (!ok) { error.value = data.message || 'No se encontró la mascota'; return }
  mascota.value = data.mascota

  // Vacunas en paralelo, no bloquea el hero
  loadingVacunas.value = true
  const { ok: okV, data: dV } = await get(`/api/mascotas/${id}/vacunas`)
  loadingVacunas.value = false
  if (okV && dV.vacunas) vacunas.value = dV.vacunas

  // Cargar recordatorios en paralelo (no bloquea)
  cargarRecordatorios()
}

// ── Modales de vacunas ────────────────────────────────────────
const modalAddVacuna     = ref(false)
const modalDetalleVacuna = ref(false)
const vacunaDetalle      = ref(null)   // vacuna_mascota para ver detalle
const marcandoId         = ref(null)   // id que se está marcando completado
const vacunaEditar       = ref(null)   // vacuna_mascota para editar
const confirmEliminar    = ref(null)   // vacuna_mascota para confirmar borrado
const eliminando         = ref(false)

function abrirDetalle(vac) {
  vacunaDetalle.value      = vac
  modalDetalleVacuna.value = true
}

function abrirEditar(vac) {
  vacunaEditar.value   = vac
  modalAddVacuna.value = true
}

function pedirEliminar(vac) {
  confirmEliminar.value = vac
}

async function confirmarEliminar() {
  if (!confirmEliminar.value) return
  eliminando.value = true
  const id = route.params.id
  const { ok, data } = await remove(
    `/api/mascotas/${id}/vacunas/${confirmEliminar.value.id}`
  )
  eliminando.value = false
  if (!ok) { return }
  confirmEliminar.value = null
  onVacunaAdded()   // recargar
}

function toggleReminder(vacId) {
  reminderVacId.value = reminderVacId.value === vacId ? null : vacId
}

async function marcarCompletada(vac) {
  marcandoId.value = vac.id
  const { ok, data: dU } = await patch(
    `/api/mascotas/${route.params.id}/vacunas/${vac.id}`,
    {
      estado:          'puesta',
      fecha_aplicacion: new Date().toISOString().split('T')[0]
    }
  )
  marcandoId.value = null
  if (ok && dU.vacuna) {
    const idx = vacunas.value.findIndex(v => v.id === vac.id)
    if (idx !== -1) vacunas.value[idx] = dU.vacuna
  }
}

async function onVacunaAdded() {
  // Recargar historial completo desde el backend para tener datos frescos
  const id = route.params.id
  loadingVacunas.value = true
  const { ok, data } = await get(`/api/mascotas/${id}/vacunas`)
  loadingVacunas.value = false
  if (ok && data.vacunas) vacunas.value = data.vacunas
}

// Días restantes para una vacuna
function diasRestantes(proxima) {
  if (!proxima) return null
  const diff = Math.ceil((new Date(proxima) - Date.now()) / (1000*60*60*24))
  if (diff > 0)  return t('petDetail.daysLeft', { n: diff })
  if (diff === 0) return t('petDetail.today')
  return t('petDetail.overdueDays', { n: Math.abs(diff) })
}

// Ejecutar al montar Y al cambiar de mascota (navegación SPA entre mascotas)
onMounted(cargarDatos)
watch(() => route.params.id, (newId) => {
  if (newId) cargarDatos()
})

// Computados
const iniciales = computed(() => (mascota.value?.nombre?.[0] || '').toUpperCase())

const edad = computed(() => {
  if (!mascota.value?.nacimiento) return null
  const m = Math.floor((Date.now() - new Date(mascota.value.nacimiento)) / (1000*60*60*24*30.44))
  if (m < 1)  return t('pets.lessThanOneMonth')
  if (m < 12) return `${m} ${m === 1 ? t('common.month') : t('common.months')}`
  const a = Math.floor(m / 12)
  return `${a} ${a === 1 ? t('common.year') : t('common.years')}`
})

const fechaNac = computed(() => {
  if (!mascota.value?.nacimiento) return null
  return new Date(mascota.value.nacimiento).toLocaleDateString(dateLocale.value, {
    day:'numeric', month:'long', year:'numeric'
  })
})

// Próxima vacuna pendiente
const proximaVacuna = computed(() =>
  [...vacunas.value]
    .filter(v => v.estado === 'pendiente' || v.estado === 'retrasada')
    .sort((a,b) => new Date(a.proxima_aplicacion) - new Date(b.proxima_aplicacion))[0] || null
)

// Estado vacunas
const badgeClass = { puesta:'bv--puesta', pendiente:'bv--pendiente', retrasada:'bv--retrasada' }
const badgeLabel = computed(() => ({ puesta: t('vaccines.statusDone'), pendiente: t('vaccines.statusPending'), retrasada: t('vaccines.statusLate') }))

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(dateLocale.value,{day:'2-digit',month:'short',year:'numeric'})
}

</script>

<template>
  <div class="md-page page-container">

    <!-- Volver -->
    <button type="button" class="md-back" @click="router.push({ name: 'mis-mascotas' })">
      <Icon :icon="$icons.back" width="16" height="16" />
      {{ t('pets.backToPets') }}
    </button>

    <!-- Loading -->
    <div v-if="loading" class="loading-center"><div class="spinner spinner-dark"/></div>

    <!-- Error -->
    <div v-else-if="error" class="card">
      <div class="card-body" style="text-align:center;padding:2.5rem">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-primary" style="margin-top:1rem" @click="router.push({ name: 'mis-mascotas' })">{{ t("pets.backToList") }}</button>
      </div>
    </div>

    <template v-else-if="mascota">

      <!-- ══ HERO ══════════════════════════════════════════ -->
      <div class="card md-hero">
        <div class="card-body md-hero-inner">

          <!-- Columna foto -->
          <div class="md-foto-col">
            <div class="md-foto-ring">
              <PetAvatar :foto="mascota.foto" :nombre="mascota.nombre" :genero="mascota.genero" tipo="mascota" size="xl" />
            </div>

            <!-- Nombre + raza bajo la foto -->
            <div class="md-foto-name">
              <!-- Fila de badges: especie + género juntos -->
              <div class="md-badges-row">
                <span
                  v-if="mascota.raza?.especie?.especie"
                  class="md-especie-pill"
                  :class="mascota.raza.especie.especie.toLowerCase() === 'perro' || mascota.raza.especie.especie.toLowerCase() === 'dog' || mascota.raza.especie.especie.toLowerCase() === 'gos' ? 'md-especie-pill--perro' : 'md-especie-pill--gato'"
                >
                  {{ mascota.raza.especie.especie.toUpperCase() }}
                </span>
                <span
                  v-if="mascota.genero"
                  class="md-genero-pill"
                  :class="mascota.genero === 'macho' ? 'md-genero-pill--m' : 'md-genero-pill--f'"
                >
                  <Icon style="flex-shrink:0" :icon="$icons.male" width="11" height="11" />
                  {{ mascota.genero === 'macho' ? t('common.male') : t('common.female') }}
                </span>
              </div>
              <h1 class="md-nombre">{{ mascota.nombre }}</h1>
              <p class="md-raza-lbl">
              {{ mascota.raza?.nombre || '—' }}
              <template v-if="mascota.es_mestizo && mascota.raza_secundaria">
                <span style="color: var(--color-text-muted); font-weight:400"> + </span>{{ mascota.raza_secundaria.nombre }}
              </template>
            </p>
            </div>
          </div>

          <!-- Columna datos -->
          <div class="md-datos-col">

            <!-- Grid de datos -->
            <div class="md-datos-grid">

              <div v-if="fechaNac" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <Icon :icon="$icons.calendar" width="13" height="13" />
                </span>
                <div>
                  <span class="md-dato-key">{{ t("petDetail.birthdate") }}</span>
                  <span class="md-dato-val">{{ fechaNac }}</span>
                </div>
              </div>

              <div v-if="mascota.genero" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <Icon :icon="$icons.male" width="14" height="14" />
                </span>
                <div>
                  <span class="md-dato-key">{{ t("petDetail.gender") }}</span>
                  <span class="md-dato-val">{{ mascota.genero === 'macho' ? t('common.male') : t('common.female') }}</span>
                </div>
              </div>

              <div v-if="mascota.peso" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <Icon :icon="$icons.weight" width="13" height="13" />
                </span>
                <div>
                  <span class="md-dato-key">{{ t("petDetail.weight") }}</span>
                  <span class="md-dato-val">{{ mascota.peso }} kg</span>
                </div>
              </div>

              <div v-if="mascota.microchip" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <Icon :icon="$icons.chip" width="13" height="13" />
                </span>
                <div>
                  <span class="md-dato-key">{{ t("petDetail.microchip") }}</span>
                  <span class="md-dato-val md-dato-val--mono">{{ mascota.microchip }}</span>
                </div>
              </div>

              <!-- Edad si hay nacimiento -->
              <div v-if="edad" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <Icon :icon="$icons.clock" width="13" height="13" />
                </span>
                <div>
                  <span class="md-dato-key">{{ t("petDetail.age") }}</span>
                  <span class="md-dato-val">{{ edad }}</span>
                </div>
              </div>

            </div>

            <!-- Botones acción -->
            <div class="md-hero-btns">
              <button type="button" class="btn btn-teal" @click="router.push({ name: 'nueva-mascota', query: { editar: mascota.id } })">
                <Icon :icon="$icons.edit" width="13" height="13" />
                {{ t('petDetail.editProfile') }}
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- ══ HISTORIAL DE VACUNAS — cartilla premium ══════════ -->
      <section class="md-section">

        <!-- Cabecera de sección -->
        <div class="md-section-head">
          <div class="md-section-title-row">
            <div class="md-section-icon">
              <Icon :icon="$icons.health" width="15" height="15" />
            </div>
            <h2 class="md-section-h2">{{ t("petDetail.vaccineHistory") }}</h2>
          </div>
          <button type="button" class="btn btn-primary btn-sm" @click="modalAddVacuna = true">
            <Icon :icon="$icons.add" width="13" height="13" />
            {{ t('petDetail.addVaccine') }}
          </button>
        </div>

        <!-- Cartilla — mini header con mascota -->
        <div class="card vac-cartilla">

          <div class="vac-cartilla-head">
            <PetAvatar :foto="mascota.foto" :nombre="mascota.nombre" :genero="mascota.genero" tipo="mascota" size="sm" />
            <div class="vac-cartilla-info">
              <p class="vac-cartilla-nombre">{{ mascota.nombre }}</p>
              <p class="vac-cartilla-sub">
                {{ t('petDetail.lastUpdate') }}:
                <strong>{{ vacunas.length > 0 ? fmt(vacunas[0].created_at) : t('petDetail.noRegisters') }}</strong>
              </p>
            </div>
            <!-- Stats rápidas -->
            <div class="vac-stats">
              <div class="vac-stat">
                <span class="vac-stat-num">{{ vacunas.filter(v => v.estado === 'puesta').length }}</span>
                <span class="vac-stat-lbl">{{ t("petDetail.upToDate") }}</span>
              </div>
              <div class="vac-stat">
                <span class="vac-stat-num vac-stat-num--warn">{{ vacunas.filter(v => v.estado === 'pendiente').length }}</span>
                <span class="vac-stat-lbl">{{ t("petDetail.pending") }}</span>
              </div>
              <div class="vac-stat">
                <span class="vac-stat-num vac-stat-num--danger">{{ vacunas.filter(v => v.estado === 'retrasada').length }}</span>
                <span class="vac-stat-lbl">{{ t("petDetail.overdue") }}</span>
              </div>
            </div>
          </div>

          <!-- Loading skeleton -->
          <div v-if="loadingVacunas" class="vac-list">
            <div class="vac-ske" v-for="i in 3" :key="i" />
          </div>

          <!-- Sin vacunas — empty state elegante -->
          <div v-else-if="vacunas.length === 0" class="vac-empty">
            <div class="vac-empty-icon">
              <Icon :icon="$icons.health" width="28" height="28" />
            </div>
            <p class="vac-empty-title">{{ t("petDetail.emptyVaccines") }}</p>
            <p class="vac-empty-sub">{{ t('petDetail.addFirstVaccineFor') }} <strong>{{ mascota.nombre }}</strong></p>
            <button type="button" class="btn btn-teal btn-sm" style="margin-top:.75rem" @click="modalAddVacuna = true">
              + {{ t('petDetail.addFirstVaccine') }}
            </button>
          </div>

          <!-- Cabecera de columnas -->
          <div v-else class="vac-thead">
            <span class="vac-th">{{ t("petDetail.colVaccine") }}</span>
            <span class="vac-th">{{ t("petDetail.colLastDose") }}</span>
            <span class="vac-th">{{ t("petDetail.colNextDose") }}</span>
            <span class="vac-th">{{ t("petDetail.colStatus") }}</span>
            <span class="vac-th">{{ t("petDetail.colDaysLeft") }}</span>
            <span class="vac-th">{{ t("petDetail.colAction") }}</span>
            <span class="vac-th"></span>
          </div>

          <!-- Filas premium -->
          <div
            v-for="vac in vacunas"
            :key="vac.id"
            class="vac-row"
            :class="`vac-row--${vac.estado}`"
          >
            <!-- Icono + nombre -->
            <div class="vac-col-nombre" @click="abrirDetalle(vac)">
              <div class="vac-row-icon" :class="`vac-row-icon--${vac.estado}`">
                <Icon class="vac-icon-emoji" :icon="vacunaInfoDisplay(vac).icon || $icons.vaccine" width="18" height="18" />
              </div>
              <div class="vac-nombre-wrap">
                <span class="vac-nombre">{{ vacunaInfoDisplay(vac).enfermedad || vac.vacuna?.nombre || '—' }}</span>
                <span class="vac-desc">{{ vacunaInfoDisplay(vac).descripcionCorta || vac.vacuna?.descripcion || '' }}</span>
              </div>
            </div>

            <!-- Fechas -->
            <span class="vac-col vac-fecha" :data-label="t('petDetail.colLastDose')">{{ fmt(vac.fecha_aplicacion) }}</span>
            <span class="vac-col vac-fecha" :class="{ 'vac-fecha--alert': vac.estado === 'retrasada' }" :data-label="t('petDetail.colNextDose')">
              {{ fmt(vac.proxima_aplicacion) }}
            </span>

            <!-- Badge estado -->
            <div class="vac-col">
              <span
                class="vac-badge"
                :style="{
                  background: estadoConfig[vac.estado]?.bg    || '#F7F2EA',
                  color:      estadoConfig[vac.estado]?.color || '#9B8A75'
                }"
              >{{ traducirEstado(vac.estado) }}</span>
            </div>

            <!-- Días restantes -->
            <div class="vac-col">
              <span
                class="vac-dias"
                :class="{
                  'vac-dias--ok':   vac.estado === 'puesta',
                  'vac-dias--warn': vac.estado === 'pendiente',
                  'vac-dias--bad':  vac.estado === 'retrasada'
                }"
              >
                {{ diasRestantes(vac.proxima_aplicacion) || '—' }}
              </span>
            </div>

            <!-- Acciones: marcar + editar + borrar + campana -->
            <div class="vac-col vac-col-acciones">
              <!-- Marcar / Ver -->
              <button type="button"
                v-if="vac.estado !== 'puesta'"
                class="btn btn-primary btn-sm vac-accion-btn"
                :disabled="marcandoId === vac.id"
                @click.stop="marcarCompletada(vac)"
              >
                <span v-if="marcandoId === vac.id" class="spinner" style="width:11px;height:11px;border-width:1.5px"/>
                <span v-else>{{ t("petDetail.markDone") }}</span>
              </button>
              <button type="button"
                v-else
                class="vac-ver-btn"
                @click.stop="abrirDetalle(vac)"
              >
                {{ t('petDetail.viewCertificate') }} →
              </button>
              <!-- Editar + Eliminar (siempre visibles al hover) -->
              <div class="vac-micro-btns">
                <button type="button" class="vac-micro-btn vac-micro-btn--edit"
                  :title="t('common.edit')" @click.stop="abrirEditar(vac)">
                  <Icon :icon="$icons.edit" width="11" height="11" />
                </button>
                <button type="button" class="vac-micro-btn vac-micro-btn--del"
                  :title="t('common.delete')" @click.stop="pedirEliminar(vac)">
                  <Icon :icon="$icons.delete" width="11" height="11" />
                </button>
              </div>
            </div>

            <!-- Campana recordatorio -->
            <div class="vac-col vac-col-bell" style="position:relative">
              <button
                type="button"
                class="vac-bell-btn"
                :class="{ 'vac-bell-btn--active': getDeVacuna(vac.id) }"
                :title="getDeVacuna(vac.id) ? t('petDetail.reminderActive') : t('petDetail.addReminder')"
                :ref="el => { if (el) reminderBtnRefs[vac.id] = el }"
                @click.stop="toggleReminder(vac.id)"
              >
                <Icon :icon="$icons.vaccine" width="14" height="14" />
                <span v-if="getDeVacuna(vac.id)" class="vac-bell-dot" />
              </button>
              <ReminderPopover
                :visible="reminderVacId === vac.id"
                :vacuna-mascota-id="vac.id"
                :proxima-aplicacion="vac.proxima_aplicacion || ''"
                :nombre-vacuna="vac.vacuna?.nombre || ''"
                :trigger-el="reminderBtnRefs[vac.id]"
                @close="reminderVacId = null"
              />
            </div>

          </div>
        </div>
      </section>

      <!-- Modal confirmación eliminar vacuna -->
      <Transition name="modal-fade">
        <div v-if="confirmEliminar" class="vac-confirm-overlay" @click.self="confirmEliminar = null">
          <div class="vac-confirm-card card">
            <div class="vac-confirm-icon">
              <Icon :icon="$icons.delete" width="22" height="22" />
            </div>
            <h3 class="vac-confirm-title">{{ t("petDetail.deleteVaccineTitle") }}</h3>
            <p class="vac-confirm-desc">
              <strong>{{ confirmEliminar.vacuna?.nombre }}</strong> {{ t('petDetail.willBeDeleted') }}
              {{ t('petDetail.deleteVaccineDesc') }}
            </p>
            <div class="vac-confirm-btns">
              <button type="button" class="btn btn-ghost" :disabled="eliminando" @click="confirmEliminar = null">{{ t("common.cancel") }}</button>
              <button type="button" class="btn-eliminar-vac btn" :disabled="eliminando" @click="confirmarEliminar">
                <span v-if="eliminando" class="spinner" style="width:13px;height:13px;border-width:2px"/>
                <span v-else>{{ t("common.delete") }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Modales de vacunas -->
      <ModalAddVacuna
        :visible="modalAddVacuna"
        :mascota="mascota"
        :mascota-id="mascota?.id"
        :vacuna-editar="vacunaEditar"
        @close="modalAddVacuna = false; vacunaEditar = null"
        @added="onVacunaAdded"
      />
      <ModalDetalleVacuna
        :visible="modalDetalleVacuna"
        :vacuna="vacunaDetalle"
        @close="modalDetalleVacuna = false"
      />

      <!-- ══ RECORDATORIOS ══════════════════════════════════ -->
      <div class="md-tips-row">

        <!-- Próxima vacuna pendiente -->
        <div v-if="proximaVacuna" class="card md-tip md-tip--coral">
          <div class="card-body md-tip-body">
            <div class="md-tip-icon md-tip-icon--coral">
              <Icon :icon="$icons.health" width="17" height="17" />
            </div>
            <div>
              <p class="md-tip-label">{{ t("petDetail.reminderTitle") }}</p>
              <p class="md-tip-text">
                {{ t('petDetail.nextVaccineOf') }} <strong>{{ mascota.nombre }}</strong> {{ t('petDetail.is') }}
                <strong>{{ proximaVacuna.vacuna?.nombre }}</strong>.
                {{ t('petDetail.expectedDate') }}: {{ fmt(proximaVacuna.proxima_aplicacion) }}.
              </p>
            </div>
          </div>
        </div>

        <!-- Consejo preventivo -->
        <div class="card md-tip md-tip--teal">
          <div class="card-body md-tip-body">
            <div class="md-tip-icon md-tip-icon--teal">
              <Icon :icon="$icons.health" width="17" height="17" />
            </div>
            <div>
              <p class="md-tip-label">{{ t("petDetail.preventiveTitle") }}</p>
              <p class="md-tip-text">
                {{ t('petDetail.preventiveTextStart') }}
                <strong>{{ mascota.nombre }}</strong> {{ t('petDetail.preventiveTextEnd') }}
              </p>
            </div>
          </div>
        </div>

      </div>

    </template>
  </div>
</template>

<style scoped>
.md-page {
  padding-top: var(--page-padding-y);
  padding-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.md-back {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: flex-start;
  /* Área táctil grande */
  min-height: 44px;
  padding: 0.5rem 0.75rem 0.5rem 0.4rem;
  border-radius: var(--radius-full);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: -0.25rem;
  transition: color var(--transition-fast), background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}
.md-back:hover,
.md-back:active {
  color: var(--color-text);
  background: var(--color-surface-alt);
}
@media (max-width: 768px) {
  .md-back {
    min-height: 48px;
    font-size: 0.9rem;
    padding: 0.6rem 1rem 0.6rem 0.5rem;
    margin-bottom: 0.25rem;
  }
}

/* ══ HERO ══════════════════════════════════════════════════ */
.md-hero { box-shadow: var(--shadow-md); }

.md-hero-inner {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 2.5rem;
  align-items: start;
  padding: 2rem 2.25rem;
}

/* Columna foto */
.md-foto-col { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; position: relative; }

.md-foto-ring {
  /* Ring sin fondo propio — PetAvatar aporta el color */
  width: 110px; height: 110px; border-radius: 50%;
  border: 3px solid var(--color-surface);
  box-shadow: var(--shadow-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: hidden;
}
.md-foto-img      { width: 100%; height: 100%; object-fit: cover; }
.md-foto-initials { font-family: var(--font-display); font-weight: 800; font-size: 3rem; color: var(--color-primary-dark); }

/* ── Badges de especie + género ─────────────────────────── */
.md-foto-name { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }

/* Fila de badges juntos */
.md-badges-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Badge especie */
.md-especie-pill {
  font-family: var(--font-display); font-weight: 800; font-size: 0.66rem; letter-spacing: 0.8px;
  padding: 0.22rem 0.7rem; border-radius: var(--radius-full); display: inline-flex; align-items: center;
}
/* Perro: turquesa */
.md-especie-pill--perro { background: var(--color-teal-light); color: var(--color-teal-dark); }
/* Gato: lila/naranja suave */
.md-especie-pill--gato  { background: rgba(200,180,220,0.22); color: #7A4FA0; }
/* Fallback si no hay clase */
.md-especie-pill:not(.md-especie-pill--perro):not(.md-especie-pill--gato) {
  background: var(--color-teal-light); color: var(--color-teal-dark);
}

/* Badge género — inline junto a especie */
.md-genero-pill {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-family: var(--font-display); font-weight: 700; font-size: 0.64rem; letter-spacing: 0.5px;
  padding: 0.2rem 0.6rem; border-radius: var(--radius-full);
}
.md-genero-pill--m { background: #EEF4FB; color: #3A5FA0; }
.md-genero-pill--f { background: #FCF0F5; color: #A03A5A; }
.md-nombre    { font-size: clamp(1.6rem, 4vw, 2.25rem); letter-spacing: -0.4px; margin: 0; line-height: 1.1; }
.md-raza-lbl  { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

/* Columna datos */
.md-datos-col { display: flex; flex-direction: column; gap: 1.25rem; }

.md-datos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.md-dato {
  display: flex; align-items: flex-start; gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
}
.md-dato-icon {
  width: 26px; height: 26px; border-radius: var(--radius-xs);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.md-dato-icon--teal { background: var(--color-teal-light); color: var(--color-teal-dark); }
.md-dato-key  { display: block; font-family: var(--font-display); font-weight: 700; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 0.08rem; }
.md-dato-val  { display: block; font-size: 0.875rem; color: var(--color-text); font-weight: 600; }
.md-dato-val--mono { font-family: monospace; font-size: 0.78rem; letter-spacing: 0.5px; }

.md-hero-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }

/* ══ SECCIÓN ═════════════════════════════════════════════ */
.md-section { display: flex; flex-direction: column; gap: 1rem; }
.md-section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.md-section-title-row { display: flex; align-items: center; gap: 0.6rem; }
.md-section-icon { width: 30px; height: 30px; border-radius: var(--radius-sm); background: var(--color-teal-light); color: var(--color-teal-dark); display: flex; align-items: center; justify-content: center; }
.md-section-h2   { font-size: 1.1rem; margin: 0; }

/* Estado vacío vacunas */
.md-vac-empty { box-shadow: var(--shadow-sm); }
.md-vac-empty-body { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2.5rem 2rem; gap: 0.5rem; }
.md-vac-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--color-surface-alt); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; margin-bottom: 0.4rem; }
.md-vac-empty-title { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--color-text); margin: 0; }
.md-vac-empty-sub   { font-size: 0.84rem; color: var(--color-text-muted); max-width: 300px; margin: 0; }

/* Tabla vacunas */
.md-vac-table  { overflow: hidden; }
.md-vac-thead  {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem; padding: 0.7rem 1.5rem;
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-display); font-weight: 700; font-size: 0.62rem;
  text-transform: uppercase; letter-spacing: 0.7px; color: var(--color-teal-dark);
}
.md-vac-row {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem; padding: 0.95rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  align-items: center; transition: background var(--transition-fast);
}
.md-vac-row:last-child { border-bottom: none; }
.md-vac-row:hover      { background: var(--color-surface-alt); }

.md-vac-name-col { display: flex; flex-direction: column; gap: 0.12rem; }
.md-vac-name { font-family: var(--font-display); font-weight: 700; font-size: 0.875rem; color: var(--color-text); }
.md-vac-desc { font-size: 0.73rem; color: var(--color-text-muted); }
.md-vac-fecha { font-size: 0.82rem; color: var(--color-text-soft); }
.md-vac-fecha--alert { color: var(--color-primary); font-weight: 700; }

/* Badges vacunas */
.bv {
  display: inline-flex; align-items: center;
  padding: 0.25rem 0.7rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
}
.bv--puesta    { background: var(--color-teal-light);    color: var(--color-teal-dark); }
.bv--pendiente { background: var(--color-primary-light); color: var(--color-primary-dark); }
.bv--retrasada { background: var(--color-danger-light);  color: var(--color-danger); }

/* ══ RECORDATORIOS ═══════════════════════════════════════ */
.md-tips-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.md-tip--coral { border: 1.5px solid var(--color-primary-light); }
.md-tip--teal  { border: 1.5px solid var(--color-teal-light); }

.md-tip-body  { display: flex; align-items: flex-start; gap: 1rem; padding: 1.2rem 1.4rem; }
.md-tip-icon  { width: 42px; height: 42px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.md-tip-icon--coral { background: var(--color-primary-light); color: var(--color-primary); }
.md-tip-icon--teal  { background: var(--color-teal-light);    color: var(--color-teal-dark); }
.md-tip-label { font-family: var(--font-display); font-weight: 800; font-size: 0.85rem; color: var(--color-text); margin-bottom: 0.3rem; }
.md-tip-text  { font-size: 0.84rem; color: var(--color-text-soft); line-height: 1.5; margin: 0; }

/* ══ RESPONSIVE ══════════════════════════════════════════ */
@media (max-width: 760px) {
  .md-hero-inner {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  .md-foto-ring { width: 95px; height: 95px; }
  .md-datos-grid { grid-template-columns: 1fr 1fr; }
  .md-vac-thead  { display: none; }
  .md-vac-row    { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 0.4rem; padding: 0.85rem 1rem; }
  .md-vac-name-col { grid-column: 1 / -1; }
  .md-tips-row { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .md-datos-grid { grid-template-columns: 1fr; }
  .md-hero-btns  { flex-direction: column; }
  .md-hero-btns .btn { width: 100%; }
  .md-foto-ring  { width: 85px; height: 85px; }
}

/* ══ CARTILLA DE VACUNAS PREMIUM ════════════════════════════ */

/* Card contenedora */
.vac-cartilla { overflow: hidden; }

/* Mini header de cartilla */
.vac-cartilla-head {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-alt);
  flex-wrap: wrap;
}
.vac-cartilla-av {
  /* Sin fondo — PetAvatar provee el color */
  width: auto; height: auto; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.vac-cartilla-av-img  { width: 100%; height: 100%; object-fit: cover; }
.vac-cartilla-av-ini  { font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; color: var(--color-primary-dark); }
.vac-cartilla-nombre  { font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; color: var(--color-text); margin: 0 0 0.1rem; }
.vac-cartilla-sub     { font-size: 0.72rem; color: var(--color-text-muted); margin: 0; }
.vac-cartilla-info    { flex: 1; }

/* Stats rápidas */
.vac-stats { display: flex; gap: 1.25rem; flex-shrink: 0; }
.vac-stat  { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
.vac-stat-num { font-family: var(--font-display); font-weight: 800; font-size: 1.25rem; color: var(--color-teal-dark); line-height: 1; }
.vac-stat-num--warn   { color: #9A6A10; }
.vac-stat-num--danger { color: var(--color-danger); }
.vac-stat-lbl { font-size: 0.62rem; font-family: var(--font-display); font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: var(--color-text-muted); }

/* Skeleton loading */
.vac-list { display: flex; flex-direction: column; }
.vac-ske {
  height: 70px; margin: 0.5rem 1.5rem;
  border-radius: var(--radius-md); background: var(--color-surface-alt);
  animation: _pulse 1.5s ease-in-out infinite;
}

/* Empty state */
.vac-empty {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 2.5rem 2rem; gap: 0.5rem;
}
.vac-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--color-surface-alt); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; margin-bottom: 0.4rem; }
.vac-empty-title { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--color-text); margin: 0; }
.vac-empty-sub   { font-size: 0.83rem; color: var(--color-text-muted); max-width: 280px; margin: 0; }

/* Cabecera columnas */
.vac-thead {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.8fr 1fr 1fr 40px;
  gap: 0.75rem;
  padding: 0.6rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-alt);
}
.vac-th {
  font-family: var(--font-display); font-weight: 700; font-size: 0.62rem;
  text-transform: uppercase; letter-spacing: 0.7px; color: var(--color-teal-dark);
}

/* Fila de vacuna */
.vac-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.8fr 1fr 1fr 40px;
  gap: 0.75rem;
  padding: 0.9rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
  transition: background var(--transition-fast);
}
.vac-row:last-child { border-bottom: none; }
.vac-row:hover      { background: rgba(0,0,0,0.02); }

/* Fondo sutil por estado */
.vac-row--pendiente { background: rgba(254,249,231,0.4); }
.vac-row--retrasada { background: rgba(253,234,234,0.4); }

/* Columna nombre (clicable) */
.vac-col-nombre {
  display: flex; align-items: center; gap: 0.75rem;
  cursor: pointer;
}
.vac-col-nombre:hover .vac-nombre { color: var(--color-teal-dark); }

/* Icono de vacuna */
.vac-row-icon {
  width: 38px; height: 38px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 1rem;
}
.vac-row-icon--puesta    { background: var(--color-teal-light);    color: var(--color-teal-dark); }
.vac-row-icon--pendiente { background: #FEF9E7;                    color: #9A6A10; }
.vac-row-icon--retrasada { background: var(--color-danger-light);  color: var(--color-danger); }

.vac-icon-emoji { font-size: 1.1rem; }

.vac-nombre-wrap { display: flex; flex-direction: column; gap: 0.1rem; }
.vac-nombre { font-family: var(--font-display); font-weight: 700; font-size: 0.875rem; color: var(--color-text); transition: color var(--transition-fast); }
.vac-desc   { font-size: 0.7rem; color: var(--color-text-muted); }

/* Columna genérica */
.vac-col { display: flex; align-items: center; }

/* Fechas */
.vac-fecha       { font-size: 0.82rem; color: var(--color-text-soft); }
.vac-fecha--alert { color: var(--color-danger); font-weight: 700; }

/* Badge estado */
.vac-badge {
  display: inline-flex; align-items: center;
  padding: 0.28rem 0.75rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
}

/* Días restantes */
.vac-dias        { font-family: var(--font-display); font-weight: 700; font-size: 0.82rem; }
.vac-dias--ok    { color: var(--color-teal-dark); }
.vac-dias--warn  { color: #9A6A10; }
.vac-dias--bad   { color: var(--color-danger); }

/* Botón acción */
.vac-accion-btn {
  font-size: 0.72rem !important;
  padding: 0.38rem 0.85rem !important;
  white-space: nowrap;
  display: inline-flex; align-items: center; gap: 0.3rem;
}

/* Enlace "ver certificado" */
.vac-ver-btn {
  font-family: var(--font-display); font-weight: 700; font-size: 0.78rem;
  color: var(--color-teal-dark); cursor: pointer; background: none; border: none;
  transition: color var(--transition-fast);
  white-space: nowrap;
}
.vac-ver-btn:hover { color: var(--color-teal); }

/* ═══════════════════════════════════════════════════════════
   VACUNAS — Mobile: tarjeta vertical premium estilo app iOS
   ═══════════════════════════════════════════════════════════ */
@media (max-width: 860px) {
  /* Ocultar thead de escritorio */
  .vac-thead { display: none; }

  /* ── La tabla pasa a lista de cards ──────────────── */
  .vac-table-body { display: flex; flex-direction: column; gap: 0; }

  .vac-row {
    display: grid;
    /* Col izq: icono+info, Col der: badge+días */
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "nombre  nombre"
      "fechas  fechas"
      "estado  dias"
      "acciones acciones";
    gap: 0;
    padding: 0;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface) !important;
    border-radius: 0;
    position: relative;
  }
  .vac-row:first-child { border-radius: var(--radius-md) var(--radius-md) 0 0; }
  .vac-row:last-child  { border-radius: 0 0 var(--radius-md) var(--radius-md); border-bottom: none; }

  /* Estados con fondo sutil */
  .vac-row--pendiente { background: rgba(254,249,231,0.6) !important; }
  .vac-row--retrasada { background: rgba(253,234,234,0.6) !important; }

  /* ── ÁREA NOMBRE: icono + nombre + descripción ─── */
  .vac-col-nombre {
    grid-area: nombre;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.95rem 1rem 0.6rem;
    cursor: pointer;
  }
  .vac-row-icon { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; font-size: 1.25rem; }
  .vac-nombre-wrap { flex: 1; min-width: 0; }
  .vac-nombre { font-size: 0.9rem; }
  .vac-desc   { font-size: 0.68rem; white-space: normal; line-height: 1.3; }

  /* ── ÁREA FECHAS: última y próxima dosis ─────────── */
  /* Las columnas vac-fecha en mobile las mostramos como pares label:valor */
  .vac-col.vac-fecha {
    grid-area: unset; /* se reorganizan en el flujo del grid */
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.18rem 1rem 0.18rem calc(1rem + 44px + 0.75rem);
    font-size: 0.8rem;
    color: var(--color-text-soft);
  }
  .vac-col.vac-fecha::before {
    content: attr(data-label);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-muted);
    min-width: 88px;
    flex-shrink: 0;
  }
  /* Dos fechas se stacks como "fechas" area */
  .vac-row > .vac-col.vac-fecha { grid-area: fechas; }
  /* Segunda fecha */
  .vac-row > .vac-col.vac-fecha + .vac-col.vac-fecha {
    grid-area: unset;
    padding-top: 0;
    padding-bottom: 0.3rem;
  }

  /* ── ÁREA ESTADO Y DÍAS ────────────────────────── */
  .vac-col:has(.vac-badge) {
    grid-area: estado;
    padding: 0.35rem 1rem 0.35rem calc(1rem + 44px + 0.75rem);
    display: flex;
    align-items: center;
  }
  .vac-badge { font-size: 0.62rem; padding: 0.22rem 0.65rem; }

  .vac-col:has(.vac-dias) {
    grid-area: dias;
    padding: 0.35rem 1rem 0.35rem 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .vac-dias { font-size: 0.85rem; font-weight: 700; }

  /* ── BARRA DE ACCIONES ─────────────────────────── */
  .vac-col-acciones {
    grid-area: acciones;
    display: flex !important;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1rem;
    border-top: 1px solid var(--color-border);
    background: rgba(0,0,0,0.015);
  }

  /* Botón marcar completada: grande y táctil */
  .vac-accion-btn {
    flex: 1;
    min-height: 42px !important;
    font-size: 0.82rem !important;
    padding: 0.55rem 1rem !important;
  }
  /* Enlace "ver certificado" */
  .vac-ver-btn {
    flex: 1;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    font-size: 0.82rem;
  }

  /* Botones editar + eliminar: siempre visibles y grandes */
  .vac-micro-btns {
    opacity: 1 !important;
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }
  .vac-micro-btn {
    width: 42px !important;
    height: 42px !important;
    border-radius: 12px !important;
    -webkit-tap-highlight-color: transparent;
  }
  .vac-micro-btn svg { width: 15px !important; height: 15px !important; }

  /* ── CAMPANA RECORDATORIO ──────────────────────── */
  /* Fix 6: campana siempre visible y con area táctil grande */
  .vac-col-bell {
    position: static !important;
    display: flex !important;
    align-items: center;
    flex-shrink: 0;
    /* z-index garantizado para que el popover no quede oculto */
    z-index: auto;
  }
  .vac-bell-btn {
    width: 42px !important;
    height: 42px !important;
    min-width: 42px;
    border-radius: 12px !important;
    opacity: 1 !important;
    /* Touch events asegurados */
    pointer-events: auto !important;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }
  .vac-bell-btn svg {
    width: 17px !important;
    height: 17px !important;
    pointer-events: none;
  }

  .vac-stats { gap: 0.75rem; }
}

@media (max-width: 480px) {
  .vac-cartilla-head { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .vac-col.vac-fecha { padding-left: 0.85rem; }
  .vac-col.vac-fecha::before { min-width: 78px; }
}

/* ── Botón campana recordatorio ─────────────────────────── */
.vac-col-bell { display: flex; align-items: center; justify-content: center; }

.vac-bell-btn {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}
.vac-bell-btn:hover  { background: var(--color-teal-light); color: var(--color-teal-dark); transform: scale(1.08); }
.vac-bell-btn--active {
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}

.vac-bell-dot {
  position: absolute; top: 4px; right: 4px;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--color-teal);
  border: 1.5px solid var(--color-surface);
}

/* ── Acciones vacuna: micro botones editar/eliminar ─────── */
.vac-col-acciones { display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-start; }

.vac-micro-btns {
  display: flex; gap: 0.25rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.vac-row:hover .vac-micro-btns { opacity: 1; }

.vac-micro-btn {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast);
  border: none; cursor: pointer;
}
.vac-micro-btn--edit { background: var(--color-teal-light); color: var(--color-teal-dark); }
.vac-micro-btn--edit:hover { background: var(--color-teal); color: #fff; }
.vac-micro-btn--del  { background: var(--color-surface-alt); color: var(--color-text-muted); }
.vac-micro-btn--del:hover  { background: var(--color-danger-light); color: var(--color-danger); }

/* ── Modal confirmación eliminar vacuna ─────────────────── */
.vac-confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(30,20,14,0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 800;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.vac-confirm-card {
  width: 100%; max-width: 360px;
  padding: 1.75rem 1.5rem;
  display: flex; flex-direction: column; align-items: center;
  gap: 0.85rem; text-align: center;
  box-shadow: var(--shadow-xl);
}
.vac-confirm-icon {
  width: 50px; height: 50px; border-radius: 50%;
  background: var(--color-danger-light); color: var(--color-danger);
  display: flex; align-items: center; justify-content: center;
}
.vac-confirm-title { font-size: 0.95rem; margin: 0; }
.vac-confirm-desc  { font-size: 0.83rem; color: var(--color-text-soft); margin: 0; }
.vac-confirm-btns  { display: flex; gap: 0.75rem; width: 100%; justify-content: center; }

.btn-eliminar-vac {
  background: var(--color-danger); color: #fff;
  padding: 0.65rem 1.4rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700; font-size: 0.875rem;
  border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;
  box-shadow: 0 3px 10px rgba(217,95,95,0.3);
  transition: background var(--transition-fast), transform var(--transition-fast);
}
.btn-eliminar-vac:hover:not(:disabled) { background: #be4b4b; transform: translateY(-1px); }
.btn-eliminar-vac:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 480px) {
  .vac-confirm-btns { flex-direction: column; }
  .vac-confirm-btns .btn, .btn-eliminar-vac { width: 100%; justify-content: center; }
  .vac-micro-btns { opacity: 1; }  /* Siempre visible en móvil */
}
</style>