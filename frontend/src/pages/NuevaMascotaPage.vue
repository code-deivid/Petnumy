<!-- src/pages/NuevaMascotaPage.vue -->
<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useApi } from '@/composables/useApi.js'
import RazaSelect from '@/components/ui/RazaSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import CropModal  from '@/components/ui/CropModal.vue'

const router           = useRouter()
const route            = useRoute()
const { get, post, patch } = useApi()
const { t } = useI18n()

function especieLabel(especie = '') {
  const v = String(especie).toLowerCase()
  if (v.includes('perro')) return t('common.dog')
  if (v.includes('gato')) return t('common.cat')
  return especie
}

const modoEdicion = computed(() => !!route.query.editar)
const mascotaId   = computed(() => route.query.editar || null)

// ── Estado ────────────────────────────────────────────────────
const todasLasRazas = ref([])
const especies      = ref([])
const cargando      = ref(false)
const guardando     = ref(false)
const formError     = ref(null)

// Foto
const fotoPreview   = ref(null)
const fotoParaCrop  = ref(null)
const cropVisible   = ref(false)

// Toggle mestizo
const esMestizo = ref(false)

const form = ref({
  nombre:     '',
  id_especie: '',
  id_raza:    '',
  id_raza2:   '',
  nacimiento: '',
  genero:     '',
  peso:       '',
  microchip:  ''
})

// ── Razas filtradas ───────────────────────────────────────────
const razasFiltradas = computed(() => {
  if (!form.value.id_especie) return []
  return todasLasRazas.value.filter(r => r.id_especie === form.value.id_especie)
})

const razasParaSegunda = computed(() =>
  razasFiltradas.value.filter(r => r.id !== form.value.id_raza)
)

function onEspecieChange() {
  form.value.id_raza  = ''
  form.value.id_raza2 = ''
}

function toggleMestizo() {
  esMestizo.value = !esMestizo.value
  if (!esMestizo.value) form.value.id_raza2 = ''
}

// ── Cargar datos ──────────────────────────────────────────────
async function cargarDatos() {
  cargando.value = true

  const [resRazas, resEspecies] = await Promise.all([
    get('/api/razas'),
    get('/api/especies')
  ])

  if (resRazas.ok && resRazas.data.razas) {
    todasLasRazas.value = resRazas.data.razas
  }

  if (resEspecies.ok && resEspecies.data.especies) {
    const validas = ['perro', 'gato']
    especies.value = resEspecies.data.especies
      .filter(e => validas.some(v => e.especie.toLowerCase().includes(v)))
      .sort((a, b) => {
        const aP = a.especie.toLowerCase().includes('perro') ? 0 : 1
        const bP = b.especie.toLowerCase().includes('perro') ? 0 : 1
        return aP - bP
      })
  }

  // Modo edición: precargar datos incluyendo mestizo
  if (modoEdicion.value) {
    const { ok, data } = await get(`/api/mascotas/${mascotaId.value}`)
    if (ok && data.mascota) {
      const m = data.mascota
      form.value.nombre     = m.nombre
      form.value.id_especie = m.raza?.especie?.id || ''
      form.value.id_raza    = m.id_raza
      form.value.nacimiento = m.nacimiento || ''
      form.value.genero     = m.genero     || ''
      form.value.peso       = m.peso != null ? String(m.peso) : ''
      form.value.microchip  = m.microchip  || ''
      if (m.foto) fotoPreview.value = m.foto

      // Precargar mestizo DESPUÉS de id_raza para que razasParaSegunda filtre bien
      // nextTick garantiza que el computed razasParaSegunda se actualiza con id_raza antes de setear id_raza2
      if (m.es_mestizo && m.id_raza_secundaria) {
        esMestizo.value = true
        await nextTick()
        form.value.id_raza2 = m.id_raza_secundaria
      }
    }
  }

  cargando.value = false
}

onMounted(cargarDatos)
// Si se navega a editar otra mascota sin desmontar el componente
watch(() => route.query.editar, (newId) => {
  if (newId !== undefined) cargarDatos()
})

// ── Foto y recorte ────────────────────────────────────────────
function handleFotoInput(e) {
  const file = e.target.files[0]
  if (!file) return
  e.target.value = ''
  const reader = new FileReader()
  reader.onload = (ev) => {
    fotoParaCrop.value = ev.target.result
    cropVisible.value  = true
  }
  reader.readAsDataURL(file)
}

function onCropConfirm(dataUrl) {
  fotoPreview.value  = dataUrl
  cropVisible.value  = false
  fotoParaCrop.value = null
}

function onCropCancel() {
  cropVisible.value  = false
  fotoParaCrop.value = null
}

// ── Validación ────────────────────────────────────────────────
function validar() {
  if (!form.value.nombre.trim()) return t('pets.name') + ' ' + t('common.required')
  if (!form.value.id_especie)    return 'La especie es obligatoria'
  if (!form.value.id_raza)       return 'La raza es obligatoria'
  if (!form.value.genero)        return t('pets.gender') + ' ' + t('common.required')
  if (esMestizo.value) {
    if (!form.value.id_raza2)                          return 'Selecciona la segunda raza'
    if (form.value.id_raza === form.value.id_raza2)    return 'Las dos razas no pueden ser iguales'
  }
  return null
}

// ── Guardar ───────────────────────────────────────────────────
async function guardar() {
  formError.value = validar()
  if (formError.value) return

  guardando.value = true

  const body = {
    nombre:              form.value.nombre.trim(),
    id_raza:             form.value.id_raza,
    genero:              form.value.genero,
    nacimiento:          form.value.nacimiento || undefined,
    peso:                form.value.peso       ? Number(form.value.peso) : undefined,
    microchip:           form.value.microchip  || undefined,
    foto:                fotoPreview.value     || undefined,
    es_mestizo:          esMestizo.value,
    // Si no es mestizo, enviar null explícitamente para limpiar la columna en BD
    id_raza_secundaria:  esMestizo.value ? (form.value.id_raza2 || null) : null
  }

  let ok, data
  if (modoEdicion.value) {
    ;({ ok, data } = await patch(`/api/mascotas/${mascotaId.value}`, body))
  } else {
    ;({ ok, data } = await post('/api/mascotas', body))
  }

  guardando.value = false

  if (!ok) {
    formError.value = data.message || t('common.error')
    return
  }

  router.push({ name: 'mis-mascotas' })
}

function volver() { router.back() }
</script>

<template>
  <div class="nm-page page-container">

    <div class="nm-head">
      <button class="btn btn-ghost btn-sm back-btn" @click="volver">
        <Icon :icon="$icons.back" width="17" height="17" />
        <span>{{ t('common.back') }}</span>
      </button>
      <h1>{{ modoEdicion ? t('pets.editPet') : t('pets.newPet') }}</h1>
    </div>

    <div v-if="cargando" class="loading-center">
      <div class="spinner spinner-dark" />
    </div>

    <template v-else>
      <!-- nm-card SIN overflow:hidden para que DatePicker y RazaSelect salgan -->
      <div class="nm-card card">
        <div class="card-body nm-inner">

          <!-- Columna foto -->
          <div class="nm-foto-col">
            <label class="nm-foto-area" for="foto-file">
              <div class="nm-foto-circle">
                <img v-if="fotoPreview" :src="fotoPreview" :alt="t('pets.pet')" class="nm-foto-img" />
                <div v-else class="nm-foto-placeholder">
                  <Icon :icon="$icons.camera" width="44" height="44" />
                </div>
                <!-- Botón + solo cuando NO hay foto -->
                <div v-if="!fotoPreview" class="nm-foto-btn">
                  <Icon :icon="$icons.add" width="14" height="14" />
                </div>
                <!-- Icono de editar sutil cuando SÍ hay foto (hover) -->
                <div v-else class="nm-foto-edit-overlay">
                  <Icon :icon="$icons.edit" width="16" height="16" />
                </div>
              </div>
              <span class="nm-foto-label">
                {{ fotoPreview ? t('pets.changePhoto') : t('pets.uploadPhoto') }}
              </span>
            </label>
            <input id="foto-file" type="file" accept="image/*" class="hidden-input" @change="handleFotoInput" />
          </div>

          <!-- Formulario -->
          <div class="nm-form">

            <Transition name="fade">
              <div v-if="formError" class="msg msg-error">{{ formError }}</div>
            </Transition>

            <!-- Nombre -->
            <div class="input-group">
              <label class="label">{{ t("pets.name") }} *</label>
              <input
                v-model="form.nombre"
                type="text"
                :placeholder="t('pets.namePlaceholder')"
                class="input"
                :class="{ 'input-error': formError && !form.nombre }"
              />
            </div>

            <!-- Especie -->
            <div class="input-group">
              <label class="label">{{ t("pets.species") }} *</label>
              <div v-if="especies.length === 0" class="text-muted-sm">{{ t("pets.speciesEmpty") }}</div>
              <div v-else class="pill-group">
                <button
                  v-for="esp in especies"
                  :key="esp.id"
                  type="button"
                  :class="['pill-btn', { 'pill-btn--on': form.id_especie === esp.id }]"
                  @click="form.id_especie = esp.id; onEspecieChange()"
                >{{ especieLabel(esp.especie) }}</button>
              </div>
            </div>

            <!-- Toggle mestizo — pill compacta -->
            <div v-if="form.id_especie" class="mestizo-pill" @click="toggleMestizo">
              <div class="mestizo-pill-text">
                <span class="mestizo-pill-label">{{ t("pets.mixed") }}</span>
                <span class="mestizo-pill-sub">{{ t("pets.mixedDesc") }}</span>
              </div>
              <div class="mini-toggle" :class="{ 'mini-toggle--on': esMestizo }">
                <div class="mini-toggle-thumb" />
              </div>
            </div>

            <!-- Razas -->
            <div v-if="form.id_especie" class="form-row">
              <div class="input-group">
                <label class="label">{{ esMestizo ? t('pets.mainBreed') + ' *' : t('pets.breed') + ' *' }}</label>
                <RazaSelect
                  v-model="form.id_raza"
                  :razas="razasFiltradas"
                  :has-error="!!(formError && !form.id_raza)"
                  :disabled="!form.id_especie"
                  :placeholder="t('pets.searchBreed')"
                />
              </div>

              <Transition name="slide-up">
                <div v-if="esMestizo" class="input-group">
                  <label class="label">{{ t("pets.secondBreed") }} *</label>
                  <RazaSelect
                    v-model="form.id_raza2"
                    :razas="razasParaSegunda"
                    :has-error="!!(formError && esMestizo && !form.id_raza2)"
                    :disabled="!form.id_raza"
                    :placeholder="t('pets.searchSecondBreed')"
                  />
                </div>
              </Transition>
            </div>

            <!-- Fecha nacimiento + Género -->
            <div class="form-row">
              <div class="input-group">
                <label class="label">{{ t("pets.birthdate") }}</label>
                <!--
                  DatePicker usa position:fixed calculado,
                  no se corta aunque haya overflow:hidden en padres.
                -->
                <DatePicker
                  v-model="form.nacimiento"
                  :placeholder="t('pets.birthdatePlaceholder')"
                  :max-date="new Date().toISOString().split('T')[0]"
                />
              </div>

              <!-- Género — solo Macho / Hembra, obligatorio -->
              <div class="input-group">
                <label class="label">
                  {{ t('pets.gender') }} *
                  <span v-if="formError && !form.genero" class="label-error">{{ t("pets.genderRequired") }}</span>
                </label>
                <div class="pill-group">
                  <button
                    type="button"
                    :class="['pill-btn pill-btn--macho', { 'pill-btn--on': form.genero === 'macho' }]"
                    @click="form.genero = 'macho'"
                  >
                    <!--
                      Iconify web component para el icono de género.
                      Cargado desde CDN en index.html (o puede añadirse aquí con script).
                      Fallback: texto si Iconify no está disponible.
                    -->
                    <Icon style="vertical-align:middle;margin-right:3px" :icon="$icons.male" width="14" height="14" />
                    {{ t('pets.male') }}
                  </button>
                  <button
                    type="button"
                    :class="['pill-btn pill-btn--hembra', { 'pill-btn--on': form.genero === 'hembra' }]"
                    @click="form.genero = 'hembra'"
                  >
                    <Icon style="vertical-align:middle;margin-right:3px" :icon="$icons.male" width="14" height="14" />
                    {{ t('pets.female') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Peso + Microchip -->
            <div class="form-row">
              <div class="input-group">
                <label class="label">{{ t("pets.weight") }}</label>
                <input v-model="form.peso" type="number" min="0" step="0.1" :placeholder="t('pets.weightPlaceholder')" class="input" />
              </div>
              <div class="input-group">
                <label class="label">{{ t("pets.microchip") }}</label>
                <input v-model="form.microchip" type="text" :placeholder="t('pets.microchipPlaceholder')" class="input" />
              </div>
            </div>

            <!-- Acciones -->
            <div class="nm-actions">
              <button class="btn btn-primary" type="button" @click="volver">{{ t("common.back") }}</button>
              <button class="btn btn-teal" type="button" :disabled="guardando" @click="guardar">
                <span v-if="guardando" class="spinner" style="width:15px;height:15px;border-width:2px"/>
                <span v-else>{{ modoEdicion ? t('pets.saveChanges') : t('pets.register') }}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Consejo del día -->
      <div class="card card-mint consejo">
        <div class="card-body">
          <p class="consejo-titulo">{{ t("pets.tip") }}</p>
          <p class="consejo-texto">
            <em>{{ t("pets.tipText") }}</em>
          </p>
        </div>
      </div>
    </template>

    <CropModal
      :image-src="fotoParaCrop"
      :visible="cropVisible"
      @confirm="onCropConfirm"
      @cancel="onCropCancel"
    />

  </div>
</template>

<style scoped>
.nm-page {
  padding-top: var(--page-padding-y);
  padding-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nm-head { display: flex; flex-direction: column; gap: 0.4rem; }
.nm-head h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); }
.back-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  background: rgba(255,255,255,0.44);
  transition: color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
}
.back-btn:hover { color: var(--color-text); background: var(--color-surface-alt); transform: translateX(-2px); }

/* ── Card: SIN overflow:hidden para que DatePicker y RazaSelect salgan ── */
.nm-card { box-shadow: var(--shadow-md); overflow: visible; }

.nm-inner {
  display: grid;
  grid-template-columns: 185px 1fr;
  gap: 2.5rem;
  align-items: start;
  /* overflow visible para que los dropdowns no queden cortados */
  overflow: visible;
}

/* Foto */
.nm-foto-col { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
.nm-foto-area { cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.55rem; }
.nm-foto-circle {
  width: 150px; height: 150px; border-radius: 50%;
  background: var(--color-surface-alt);
  border: 2.5px dashed var(--color-border);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: visible;
  transition: border-color var(--transition-fast);
}
.nm-foto-area:hover .nm-foto-circle { border-color: var(--color-teal); }
.nm-foto-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.nm-foto-placeholder {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
}
.nm-foto-btn {
  position: absolute; bottom: -8px; right: -8px;
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-teal);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(124,203,194,0.45);
  color: #fff;
  z-index: 2;
}
.nm-foto-label { font-family: var(--font-display); font-weight: 700; font-size: 0.72rem; color: var(--color-primary); text-align: center; }

/* Overlay editar foto (al hacer hover cuando ya hay foto) */
.nm-foto-edit-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(30,20,14,0.30);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 200ms ease;
}
.nm-foto-area:hover .nm-foto-edit-overlay { opacity: 1; }
.hidden-input { display: none; }

/* Formulario */
.nm-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

/* Pills especie/género */
.pill-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.pill-btn {
  padding: 0.5rem 1.25rem; border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-alt);
  font-family: var(--font-display); font-weight: 600; font-size: 0.85rem;
  color: var(--color-text-soft); cursor: pointer;
  display: flex; align-items: center;
  transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
}
.pill-btn:hover { border-color: var(--color-teal); color: var(--color-text); }
.pill-btn--on   { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary-dark); font-weight: 700; }

/* Macho activo — azul pastel */
.pill-btn--macho.pill-btn--on  { border-color: #7AAED4; background: #EEF4FB; color: #3A5FA0; }
/* Hembra activo — rosa pastel */
.pill-btn--hembra.pill-btn--on { border-color: #D48FAE; background: #FCF0F5; color: #A03A5A; }

.label-error { font-weight: 600; color: var(--color-danger); font-size: 0.72rem; text-transform: none; letter-spacing: 0; }

/* Mestizo pill */
.mestizo-pill {
  display: inline-flex; align-items: center; gap: 0.9rem;
  padding: 0.55rem 1rem 0.55rem 1.1rem;
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer; user-select: none; width: fit-content;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.mestizo-pill:hover { border-color: var(--color-teal); background: var(--color-teal-light); }
.mestizo-pill-text { display: flex; flex-direction: column; gap: 0.05rem; }
.mestizo-pill-label { font-family: var(--font-display); font-weight: 700; font-size: 0.85rem; color: var(--color-text); line-height: 1; }
.mestizo-pill-sub   { font-size: 0.7rem; color: var(--color-text-muted); line-height: 1; }
.mini-toggle { width: 36px; height: 20px; border-radius: var(--radius-full); background: var(--color-border); position: relative; flex-shrink: 0; cursor: pointer; transition: background var(--transition-normal); }
.mini-toggle--on { background: var(--color-teal); }
.mini-toggle-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(60,46,31,0.2); transition: transform var(--transition-normal); }
.mini-toggle--on .mini-toggle-thumb { transform: translateX(16px); }

/* Acciones */
.nm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.5rem; }

/* Consejo */
.consejo { border: 1.5px solid var(--color-teal-light); }
.consejo-titulo { font-family: var(--font-display); font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.6px; color: var(--color-teal-dark); margin-bottom: 0.35rem; }
.consejo-texto  { font-size: 0.875rem; color: var(--color-text-soft); margin: 0; }

.text-muted-sm { font-size: 0.85rem; color: var(--color-text-muted); font-style: italic; }

/* Responsive */
@media (max-width: 720px) {
  .nm-inner { grid-template-columns: 1fr; }
  .nm-foto-circle { width: 120px; height: 120px; }
}
@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
  .nm-actions { flex-direction: column-reverse; }
  .nm-actions .btn { width: 100%; }
}

/* ── Mejoras móvil ───────────────────────────────────────── */
@media (max-width: 768px) {
  /* Radio de género más grande */
  .nm-genero-option { min-height: 48px; padding: 0.65rem 1rem; }
  .nm-foto-btn { width: 36px; height: 36px; right: -8px; bottom: -8px; }
  .nm-foto-circle { width: 120px; height: 120px; }
  /* Botones de submit grandes */
  .nm-submit-row { flex-direction: column; gap: 0.6rem; }
  .nm-submit-row .btn { width: 100%; min-height: 50px; font-size: 1rem; }
  /* Paso a paso más claro */
  .nm-steps { gap: 0.25rem; }
}
@media (max-width: 480px) {
  .input { font-size: 16px !important; } /* evitar zoom iOS */
}
</style>
