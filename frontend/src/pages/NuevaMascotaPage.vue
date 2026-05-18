<!-- src/pages/NuevaMascotaPage.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import RazaSelect from '@/components/ui/RazaSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import CropModal  from '@/components/ui/CropModal.vue'

const router           = useRouter()
const route            = useRoute()
const { get, post, patch } = useApi()

// ── Modo edición ──────────────────────────────────────────────
const modoEdicion = computed(() => !!route.query.editar)
const mascotaId   = computed(() => route.query.editar || null)

// ── Estado ────────────────────────────────────────────────────
const todasLasRazas = ref([])
const especies      = ref([])
const cargando      = ref(false)
const guardando     = ref(false)
const formError     = ref(null)

// Foto — FIX: fotoPreview se incluye en el body al guardar
const fotoPreview  = ref(null)   // dataURL final (tras crop) o URL existente
const fotoParaCrop = ref(null)   // dataURL temporal antes del crop
const cropVisible  = ref(false)

// Toggle mestizo
const esMestizo = ref(false)

const form = ref({
  nombre:     '',
  id_especie: '',
  id_raza:    '',
  id_raza2:   '',
  nacimiento: '',
  genero:     '',   // solo 'macho' | 'hembra' — obligatorio
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

  // Cargar datos en modo edición
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
      // FIX: cargar foto existente en el preview
      if (m.foto) fotoPreview.value = m.foto
    }
  }

  cargando.value = false
}

onMounted(cargarDatos)

// ── Foto y recorte ────────────────────────────────────────────
function handleFotoInput(e) {
  const file = e.target.files[0]
  if (!file) return
  // Reset el input para permitir seleccionar el mismo archivo
  e.target.value = ''
  const reader = new FileReader()
  reader.onload = (ev) => {
    fotoParaCrop.value = ev.target.result
    cropVisible.value  = true
  }
  reader.readAsDataURL(file)
}

function onCropConfirm(dataUrl) {
  fotoPreview.value  = dataUrl   // dataURL que se enviará al backend
  cropVisible.value  = false
  fotoParaCrop.value = null
}

function onCropCancel() {
  cropVisible.value  = false
  fotoParaCrop.value = null
}

// ── Validación ────────────────────────────────────────────────
function validar() {
  if (!form.value.nombre.trim()) return 'El nombre de la mascota es obligatorio'
  if (!form.value.id_especie)    return 'La especie es obligatoria'
  if (!form.value.id_raza)       return 'La raza es obligatoria'
  // FIX: género obligatorio
  if (!form.value.genero)        return 'Selecciona el género de la mascota'
  if (esMestizo.value) {
    if (!form.value.id_raza2)              return 'Selecciona la segunda raza'
    if (form.value.id_raza === form.value.id_raza2) return 'Las dos razas no pueden ser iguales'
  }
  return null
}

// ── Guardar ───────────────────────────────────────────────────
async function guardar() {
  formError.value = validar()
  if (formError.value) return

  guardando.value = true

  const body = {
    nombre:     form.value.nombre.trim(),
    id_raza:    form.value.id_raza,
    genero:     form.value.genero,
    nacimiento: form.value.nacimiento || undefined,
    peso:       form.value.peso ? Number(form.value.peso) : undefined,
    microchip:  form.value.microchip  || undefined,
    // FIX: incluir foto en el body para que se guarde en la BD
    foto:       fotoPreview.value     || undefined
  }

  let ok, data
  if (modoEdicion.value) {
    ;({ ok, data } = await patch(`/api/mascotas/${mascotaId.value}`, body))
  } else {
    ;({ ok, data } = await post('/api/mascotas', body))
  }

  guardando.value = false

  if (!ok) {
    formError.value = data.message || 'Error al guardar la mascota'
    return
  }

  router.push({ name: 'mis-mascotas' })
}

function volver() { router.back() }
</script>

<template>
  <div class="nm-page page-container">

    <!-- Cabecera -->
    <div class="nm-head">
      <button class="btn btn-ghost btn-sm back-btn" @click="volver">← Volver</button>
      <h1>{{ modoEdicion ? 'Editar mascota' : 'Añadir una nueva Mascota' }}</h1>
    </div>

    <!-- Loading -->
    <div v-if="cargando" class="loading-center">
      <div class="spinner spinner-dark" />
    </div>

    <template v-else>
      <div class="nm-card card">
        <div class="card-body nm-inner">

          <!-- ── Columna foto ─────────────────────────────── -->
          <div class="nm-foto-col">
            <label class="nm-foto-area" for="foto-file">
              <div class="nm-foto-circle">
                <img v-if="fotoPreview" :src="fotoPreview" alt="Foto mascota" class="nm-foto-img" />
                <div v-else class="nm-foto-placeholder">
                  <svg width="52" height="52" viewBox="0 0 60 60" fill="none">
                    <ellipse cx="14" cy="24" rx="6"   ry="8"   fill="#D4C4B0"/>
                    <ellipse cx="46" cy="24" rx="6"   ry="8"   fill="#D4C4B0"/>
                    <ellipse cx="24" cy="14" rx="5.5" ry="7.5" fill="#D4C4B0"/>
                    <ellipse cx="36" cy="14" rx="5.5" ry="7.5" fill="#D4C4B0"/>
                    <path d="M30 28c-10 0-18 8-18 15 0 5 4 9 9 9 3.5 0 5.5-1.5 9-1.5s5.5 1.5 9 1.5c5 0 9-4 9-9 0-7-8-15-18-15z" fill="#D4C4B0"/>
                  </svg>
                </div>
                <div class="nm-foto-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              </div>
              <span class="nm-foto-label">
                {{ fotoPreview ? 'Cambiar foto' : 'Subir foto' }}
              </span>
            </label>
            <input
              id="foto-file"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="handleFotoInput"
            />
          </div>

          <!-- ── Formulario ────────────────────────────────── -->
          <div class="nm-form">

            <Transition name="fade">
              <div v-if="formError" class="msg msg-error">{{ formError }}</div>
            </Transition>

            <!-- Nombre -->
            <div class="input-group">
              <label class="label">Nombre *</label>
              <input
                v-model="form.nombre"
                type="text"
                placeholder="Ej: Mochi, Canela..."
                class="input"
                :class="{ 'input-error': formError && !form.nombre }"
              />
            </div>

            <!-- Especie -->
            <div class="input-group">
              <label class="label">Especie *</label>
              <div v-if="especies.length === 0" class="text-muted-sm">
                No hay especies disponibles
              </div>
              <div v-else class="pill-group">
                <button
                  v-for="esp in especies"
                  :key="esp.id"
                  type="button"
                  :class="['pill-btn', { 'pill-btn--on': form.id_especie === esp.id }]"
                  @click="form.id_especie = esp.id; onEspecieChange()"
                >{{ esp.especie }}</button>
              </div>
            </div>

            <!-- Mestizo pill compacto — FIX: rediseño minimalista -->
            <div v-if="form.id_especie" class="mestizo-pill" @click="toggleMestizo">
              <div class="mestizo-pill-text">
                <span class="mestizo-pill-label">Mestizo</span>
                <span class="mestizo-pill-sub">Mezcla de dos razas</span>
              </div>
              <!-- Toggle mini inline -->
              <div class="mini-toggle" :class="{ 'mini-toggle--on': esMestizo }">
                <div class="mini-toggle-thumb" />
              </div>
            </div>

            <!-- Razas -->
            <div v-if="form.id_especie" class="form-row">
              <div class="input-group">
                <label class="label">{{ esMestizo ? 'Raza principal *' : 'Raza *' }}</label>
                <RazaSelect
                  v-model="form.id_raza"
                  :razas="razasFiltradas"
                  :has-error="!!(formError && !form.id_raza)"
                  :disabled="!form.id_especie"
                  placeholder="Busca una raza..."
                />
              </div>

              <Transition name="slide-up">
                <div v-if="esMestizo" class="input-group">
                  <label class="label">Segunda raza *</label>
                  <RazaSelect
                    v-model="form.id_raza2"
                    :razas="razasParaSegunda"
                    :has-error="!!(formError && esMestizo && !form.id_raza2)"
                    :disabled="!form.id_raza"
                    placeholder="Segunda raza..."
                  />
                </div>
              </Transition>
            </div>

            <!-- Nacimiento + Género en fila -->
            <div class="form-row">
              <div class="input-group">
                <label class="label">Fecha de nacimiento</label>
                <DatePicker
                  v-model="form.nacimiento"
                  placeholder="Selecciona fecha"
                  :max-date="new Date().toISOString().split('T')[0]"
                />
              </div>

              <!-- FIX: solo Macho / Hembra, género obligatorio -->
              <div class="input-group">
                <label class="label">
                  Género *
                  <span v-if="formError && !form.genero" class="label-error">
                    — Selecciona uno
                  </span>
                </label>
                <div class="pill-group">
                  <button
                    type="button"
                    :class="['pill-btn pill-btn--macho', { 'pill-btn--on': form.genero === 'macho' }]"
                    @click="form.genero = 'macho'"
                  >
                    Macho
                  </button>
                  <button
                    type="button"
                    :class="['pill-btn pill-btn--hembra', { 'pill-btn--on': form.genero === 'hembra' }]"
                    @click="form.genero = 'hembra'"
                  >
                    Hembra
                  </button>
                </div>
              </div>
            </div>

            <!-- Peso + Microchip -->
            <div class="form-row">
              <div class="input-group">
                <label class="label">Peso (kg)</label>
                <input
                  v-model="form.peso"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="10"
                  class="input"
                />
              </div>
              <div class="input-group">
                <label class="label">Microchip</label>
                <input
                  v-model="form.microchip"
                  type="text"
                  placeholder="2346656453"
                  class="input"
                />
              </div>
            </div>

            <!-- Acciones -->
            <div class="nm-actions">
              <button class="btn btn-primary" type="button" @click="volver">
                Volver
              </button>
              <button
                class="btn btn-teal"
                type="button"
                :disabled="guardando"
                @click="guardar"
              >
                <span v-if="guardando" class="spinner" style="width:15px;height:15px;border-width:2px"/>
                <span v-else>{{ modoEdicion ? 'Guardar cambios' : 'Registrar' }}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Consejo del día -->
      <div class="card card-mint consejo">
        <div class="card-body">
          <p class="consejo-titulo">Consejo del día</p>
          <p class="consejo-texto">
            <em>Mantén al día las vacunas y revisiones veterinarias para asegurar una vida larga y saludable.</em>
          </p>
        </div>
      </div>
    </template>

    <!-- Modal de recorte -->
    <CropModal
      :image-src="fotoParaCrop"
      :visible="cropVisible"
      @confirm="onCropConfirm"
      @cancel="onCropCancel"
    />

  </div>
</template>

<style scoped>
/* ── Página ──────────────────────────────────────────────────── */
.nm-page {
  padding-top: var(--page-padding-y);
  padding-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nm-head { display: flex; flex-direction: column; gap: 0.4rem; }
.nm-head h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); }
.back-btn { align-self: flex-start; padding-left: 0; color: var(--color-text-muted); }

/* ── Card ────────────────────────────────────────────────────── */
.nm-card { box-shadow: var(--shadow-md); }

.nm-inner {
  display: grid;
  grid-template-columns: 185px 1fr;
  gap: 2.5rem;
  align-items: start;
}

/* ── Foto ────────────────────────────────────────────────────── */
.nm-foto-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.nm-foto-area {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}

.nm-foto-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  border: 2.5px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: border-color var(--transition-fast);
}
.nm-foto-area:hover .nm-foto-circle { border-color: var(--color-teal); }

.nm-foto-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.nm-foto-placeholder { opacity: 0.5; }

.nm-foto-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(124,203,194,0.5);
}

.nm-foto-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.72rem;
  color: var(--color-primary);
  text-align: center;
}

.hidden-input { display: none; }

/* ── Formulario ──────────────────────────────────────────────── */
.nm-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── Pills genéricas (especie, género) ───────────────────────── */
.pill-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill-btn {
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-alt);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text-soft);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}
.pill-btn:hover { border-color: var(--color-teal); color: var(--color-text); }

/* Estado activo genérico (especie) */
.pill-btn--on {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-weight: 700;
}

/* Estado activo macho — azul pastel */
.pill-btn--macho.pill-btn--on {
  border-color: #7AAED4;
  background: #EEF4FB;
  color: #3A5FA0;
}

/* Estado activo hembra — rosa pastel */
.pill-btn--hembra.pill-btn--on {
  border-color: #D48FAE;
  background: #FCF0F5;
  color: #A03A5A;
}

/* Error inline en label género */
.label-error {
  font-weight: 600;
  color: var(--color-danger);
  font-size: 0.72rem;
  text-transform: none;
  letter-spacing: 0;
}

/* ── Mestizo pill compacto ───────────────────────────────────── */
/* FIX: rediseño minimalista — ya no es un rectángulo grande */
.mestizo-pill {
  display: inline-flex;           /* ← no ocupa todo el ancho */
  align-items: center;
  gap: 0.9rem;
  padding: 0.55rem 1rem 0.55rem 1.1rem;
  background: var(--color-surface-alt);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  user-select: none;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
  width: fit-content;             /* ← ocupa solo lo necesario */
}

.mestizo-pill:hover {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
}

.mestizo-pill-text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.mestizo-pill-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1;
}

.mestizo-pill-sub {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  line-height: 1;
}

/* Toggle mini inline dentro de la pill */
.mini-toggle {
  width: 36px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  position: relative;
  flex-shrink: 0;
  transition: background var(--transition-normal);
}

.mini-toggle--on {
  background: var(--color-teal);
}

.mini-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(60,46,31,0.2);
  transition: transform var(--transition-normal);
}

.mini-toggle--on .mini-toggle-thumb {
  transform: translateX(16px);
}

/* ── Acciones ────────────────────────────────────────────────── */
.nm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

/* ── Consejo ─────────────────────────────────────────────────── */
.consejo { border: 1.5px solid var(--color-teal-light); }
.consejo-titulo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-teal-dark);
  margin-bottom: 0.35rem;
}
.consejo-texto { font-size: 0.875rem; color: var(--color-text-soft); margin: 0; }

/* ── Util ────────────────────────────────────────────────────── */
.text-muted-sm { font-size: 0.85rem; color: var(--color-text-muted); font-style: italic; }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 720px) {
  .nm-inner { grid-template-columns: 1fr; }
  .nm-foto-circle { width: 120px; height: 120px; }
}

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
  .nm-actions { flex-direction: column-reverse; }
  .nm-actions .btn { width: 100%; }
}
</style>
