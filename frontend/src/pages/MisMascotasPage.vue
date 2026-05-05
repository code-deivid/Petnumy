<!-- src/pages/MisMascotasPage.vue -->

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi.js'

const { get, post, remove } = useApi()

// ── Estado principal ──────────────────────────────────────────
const mascotas = ref([])
const razas    = ref([])
const loading  = ref(false)
const error    = ref(null)

// ── Estado del formulario ─────────────────────────────────────
const mostrarForm = ref(false)
const guardando   = ref(false)
const formError   = ref(null)

const form = ref({
  nombre:     '',
  id_raza:    '',
  genero:     '',
  nacimiento: ''
})

// ── Carga inicial ─────────────────────────────────────────────
async function cargarMascotas() {
  loading.value = true
  error.value   = null

  const { ok, data } = await get('/api/mascotas')

  loading.value = false

  if (!ok) {
    error.value = data.message || 'No se pudieron cargar las mascotas'
    return
  }

  mascotas.value = data.mascotas
}

async function cargarRazas() {
  const { ok, data } = await get('/api/razas')
  if (ok) razas.value = data.razas
}

onMounted(() => {
  cargarMascotas()
  cargarRazas()
})

// ── Formulario ────────────────────────────────────────────────
function abrirForm() {
  form.value    = { nombre: '', id_raza: '', genero: '', nacimiento: '' }
  formError.value = null
  mostrarForm.value = true
}

function cerrarForm() {
  mostrarForm.value = false
  formError.value   = null
}

function validarForm() {
  if (!form.value.nombre.trim()) return 'El nombre es obligatorio'
  if (!form.value.id_raza)       return 'La raza es obligatoria'
  return null
}

async function crearMascota() {
  formError.value = validarForm()
  if (formError.value) return

  guardando.value = true

  const body = {
    nombre:     form.value.nombre.trim(),
    id_raza:    form.value.id_raza,
    genero:     form.value.genero     || undefined,
    nacimiento: form.value.nacimiento || undefined
  }

  const { ok, data } = await post('/api/mascotas', body)

  guardando.value = false

  if (!ok) {
    formError.value = data.message || 'Error al crear la mascota'
    return
  }

  cerrarForm()
  cargarMascotas()
}

// ── Eliminar ──────────────────────────────────────────────────
async function eliminarMascota(mascota) {
  const confirmar = window.confirm(
    `¿Seguro que quieres eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`
  )
  if (!confirmar) return

  const { ok, data } = await remove(`/api/mascotas/${mascota.id}`)

  if (!ok) {
    alert(data.message || 'No se pudo eliminar la mascota')
    return
  }

  cargarMascotas()
}

// ── Utilidad: emoji por especie ───────────────────────────────
function emojiMascota(mascota) {
  const especie = mascota.raza?.especie?.especie?.toLowerCase() || ''
  if (especie.includes('perro')) return '🐶'
  if (especie.includes('gato'))  return '🐱'
  if (especie.includes('conejo'))return '🐰'
  if (especie.includes('pájaro') || especie.includes('pajaro')) return '🐦'
  return '🐾'
}
</script>

<template>
  <div class="page-container page-section">

    <!-- Cabecera -->
    <div class="flex items-center justify-between" style="margin-bottom: 2rem">
      <div class="flex flex-col gap-1">
        <h1>Mis mascotas 🐾</h1>
        <p>Gestiona a tus compañeros peludos</p>
      </div>
      <button class="btn btn-primary" @click="abrirForm">
        + Añadir mascota
      </button>
    </div>

    <!-- Formulario de creación -->
    <Transition name="slide-up">
      <div v-if="mostrarForm" class="card form-card" style="margin-bottom: 2rem">
        <div class="card-body flex flex-col gap-4">

          <div class="flex items-center justify-between">
            <h3>Nueva mascota</h3>
            <button class="btn btn-ghost btn-sm" @click="cerrarForm">✕ Cerrar</button>
          </div>

          <hr class="divider" />

          <!-- Error de formulario -->
          <Transition name="fade">
            <div v-if="formError" class="form-error">{{ formError }}</div>
          </Transition>

          <div class="form-grid">

            <!-- Nombre -->
            <div class="flex flex-col gap-1">
              <label class="label" for="nombre">Nombre *</label>
              <input
                id="nombre"
                v-model="form.nombre"
                type="text"
                placeholder="Luna, Max..."
                class="input"
              />
            </div>

            <!-- Raza -->
            <div class="flex flex-col gap-1">
              <label class="label" for="raza">Raza *</label>
              <select id="raza" v-model="form.id_raza" class="input">
                <option value="" disabled>Selecciona una raza</option>
                <option
                  v-for="raza in razas"
                  :key="raza.id"
                  :value="raza.id"
                >
                  {{ raza.nombre }}
                </option>
              </select>
            </div>

            <!-- Género -->
            <div class="flex flex-col gap-1">
              <label class="label" for="genero">Género</label>
              <select id="genero" v-model="form.genero" class="input">
                <option value="">Sin especificar</option>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </select>
            </div>

            <!-- Fecha de nacimiento -->
            <div class="flex flex-col gap-1">
              <label class="label" for="nacimiento">Fecha de nacimiento</label>
              <input
                id="nacimiento"
                v-model="form.nacimiento"
                type="date"
                class="input"
                :max="new Date().toISOString().split('T')[0]"
              />
            </div>

          </div>

          <!-- Acciones -->
          <div class="flex gap-3 justify-end">
            <button class="btn btn-ghost" @click="cerrarForm">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="crearMascota">
              <span v-if="guardando" class="spinner" style="width:16px;height:16px;border-width:2px" />
              <span v-else>Guardar mascota</span>
            </button>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Estado: cargando -->
    <div v-if="loading" class="flex justify-center" style="padding: 4rem 0">
      <div class="spinner" />
    </div>

    <!-- Estado: error -->
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-outline" style="margin-top: 1rem" @click="cargarMascotas">
        Reintentar
      </button>
    </div>

    <!-- Estado: sin mascotas -->
    <div v-else-if="mascotas.length === 0 && !mostrarForm" class="empty-state">
      <p style="font-size: 2rem; margin-bottom: 0.5rem">🐾</p>
      <p>Aún no tienes mascotas registradas</p>
      <button class="btn btn-primary" style="margin-top: 1rem" @click="abrirForm">
        Añadir mi primera mascota
      </button>
    </div>

    <!-- Lista de mascotas -->
    <div v-else-if="mascotas.length > 0" class="mascotas-grid">
      <div
        v-for="mascota in mascotas"
        :key="mascota.id"
        class="card card-animate mascota-card"
      >
        <div class="card-body flex flex-col gap-3">

          <!-- Cabecera de la card -->
          <div class="flex items-center gap-3">
            <span class="mascota-emoji">{{ emojiMascota(mascota) }}</span>
            <div class="flex flex-col gap-1" style="flex: 1; min-width: 0">
              <h3 class="mascota-nombre">{{ mascota.nombre }}</h3>
              <span class="mascota-raza">{{ mascota.raza?.nombre || '—' }}</span>
            </div>
            <span v-if="mascota.genero" :class="['badge', mascota.genero === 'macho' ? 'badge-green' : 'badge-orange']">
              {{ mascota.genero === 'macho' ? '♂' : '♀' }} {{ mascota.genero }}
            </span>
          </div>

          <hr class="divider" />

          <!-- Datos extra -->
          <div class="flex flex-col gap-1">
            <span v-if="mascota.nacimiento" class="mascota-dato">
              🎂 {{ new Date(mascota.nacimiento).toLocaleDateString('es-ES') }}
            </span>
            <span v-if="mascota.peso" class="mascota-dato">
              ⚖️ {{ mascota.peso }} kg
            </span>
            <span v-if="mascota.raza?.especie?.especie" class="mascota-dato">
              🐾 {{ mascota.raza.especie.especie }}
            </span>
          </div>

          <!-- Acción eliminar -->
          <button
            class="btn btn-ghost btn-sm mascota-delete"
            @click="eliminarMascota(mascota)"
          >
            🗑️ Eliminar
          </button>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Grid de mascotas */
.mascotas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* Card de mascota */
.mascota-emoji {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.mascota-nombre {
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mascota-raza {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.mascota-dato {
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

.mascota-delete {
  align-self: flex-start;
  color: var(--color-danger);
  padding-left: 0;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.mascota-delete:hover {
  opacity: 1;
}

/* Formulario */
.form-card {
  border: 1.5px solid var(--color-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-error {
  background-color: #FDEAEA;
  color: #B04040;
  border: 1.5px solid #F0BABA;
  border-radius: var(--radius-md);
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-family: var(--font-display);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 540px) {
  .mascotas-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
