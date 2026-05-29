<!-- src/pages/PerfilPage.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n }    from 'vue-i18n'
import { useRouter }  from 'vue-router'
import { useApi }     from '@/composables/useApi.js'
import { useAuthStore } from '@/stores/auth.store.js'
import DatePicker from '@/components/ui/DatePicker.vue'
import CropModal  from '@/components/ui/CropModal.vue'

const { t }     = useI18n()
const router    = useRouter()
const { patch, get } = useApi()
const authStore = useAuthStore()

// ── Estado ────────────────────────────────────────────────────
const guardando   = ref(false)
const mensaje     = ref(null)
const errorMsg    = ref(null)
const fotoPreview = ref(authStore.usuario?.foto || null)
const fotoParaCrop = ref(null)
const cropVisible  = ref(false)

const form = ref({
  nombre:          authStore.usuario?.nombre           || '',
  apellidos:       authStore.usuario?.apellidos        || '',
  fecha_nacimiento:authStore.usuario?.fecha_nacimiento || '',
  telefono:        authStore.usuario?.telefono         || '',
  ciudad:          authStore.usuario?.ciudad           || ''
})

// Cargar perfil actualizado desde el servidor
onMounted(async () => {
  const { ok, data } = await get('/api/auth/me')
  if (ok && data.usuario) {
    const u = data.usuario
    form.value.nombre           = u.nombre           || ''
    form.value.apellidos        = u.apellidos        || ''
    form.value.fecha_nacimiento = u.fecha_nacimiento || ''
    form.value.telefono         = u.telefono         || ''
    form.value.ciudad           = u.ciudad           || ''
    if (u.foto) fotoPreview.value = u.foto
  }
})

// ── Iniciales fallback ────────────────────────────────────────
const iniciales = computed(() => {
  const n = form.value.nombre    || ''
  const a = form.value.apellidos || ''
  return ((n[0] || '') + (a[0] || '')).toUpperCase() || 'U'
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

// ── Guardar ───────────────────────────────────────────────────
async function guardar() {
  if (!form.value.nombre.trim()) {
    errorMsg.value = 'El nombre es obligatorio'
    return
  }

  guardando.value = true
  mensaje.value   = null
  errorMsg.value  = null

  const body = {
    nombre:    form.value.nombre.trim(),
    apellidos: form.value.apellidos.trim() || undefined,
    foto:      fotoPreview.value           || undefined,
    fecha_nacimiento: form.value.fecha_nacimiento || undefined,
    telefono:  form.value.telefono.trim()  || undefined,
    ciudad:    form.value.ciudad.trim()    || undefined
  }

  const { ok, data } = await patch('/api/auth/me', body)
  guardando.value = false

  if (!ok) {
    errorMsg.value = data.message || t('profile.errorMsg')
    return
  }

  // Actualizar store con los datos devueltos
  authStore.setUsuario({
    ...authStore.usuario,
    ...data.usuario,
    foto: fotoPreview.value || data.usuario?.foto || null
  })

  mensaje.value = t('profile.successMsg')
  // Ocultar mensaje de éxito tras 3 segundos
  setTimeout(() => { mensaje.value = null }, 3000)
}
</script>

<template>
  <div class="pf-page page-container">

    <!-- Cabecera -->
    <div class="pf-head">
      <button class="btn btn-ghost btn-sm back-btn" @click="router.back()">
        <Icon :icon="$icons.back" width="17" height="17" />
        <span>{{ t('common.back') }}</span>
      </button>
      <h1>{{ t('profile.title') }}</h1>
    </div>

    <div class="pf-layout">

      <!-- ── Columna izquierda: avatar + datos rápidos ─────── -->
      <div class="pf-sidebar">
        <div class="pf-avatar-card card">
          <div class="card-body pf-avatar-body">

            <!-- Avatar / foto -->
            <div class="pf-avatar-wrap">
              <div class="pf-avatar-circle">
                <img
                  v-if="fotoPreview"
                  :src="fotoPreview"
                  :alt="t('profile.photo')"
                  class="pf-avatar-img"
                />
                <span v-else class="pf-avatar-initials">{{ iniciales }}</span>
              </div>

              <!-- Botón cambiar foto -->
              <label class="pf-avatar-change" for="foto-perfil" :title="t('profile.changePhoto')">
                <Icon :icon="$icons.camera" width="14" height="14" />
              </label>
              <input
                id="foto-perfil"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleFotoInput"
              />
            </div>

            <!-- Nombre y email bajo el avatar -->
            <p class="pf-nombre">
              {{ form.nombre || authStore.usuario?.nombre || '—' }}
              <span v-if="form.apellidos"> {{ form.apellidos }}</span>
            </p>
            <p class="pf-email">{{ authStore.usuario?.email }}</p>

          </div>
        </div>
      </div>

      <!-- ── Columna derecha: formulario ───────────────────── -->
      <div class="card pf-form-card">
        <div class="card-body pf-form-body">

          <h2 class="pf-section-title">{{ t('profile.personalInfo') }}</h2>

          <!-- Mensajes -->
          <Transition name="fade">
            <div v-if="mensaje"  class="msg msg-success pf-msg">{{ mensaje }}</div>
          </Transition>
          <Transition name="fade">
            <div v-if="errorMsg" class="msg msg-error pf-msg">{{ errorMsg }}</div>
          </Transition>

          <div class="pf-form">

            <!-- Nombre + Apellidos -->
            <div class="form-row">
              <div class="input-group">
                <label class="label">{{ t('profile.name') }} *</label>
                <input
                  v-model="form.nombre"
                  type="text"
                  class="input"
                  :class="{ 'input-error': errorMsg && !form.nombre }"
                  :placeholder="t('profile.namePlaceholder')"
                />
              </div>
              <div class="input-group">
                <label class="label">{{ t('profile.lastName') }}</label>
                <input
                  v-model="form.apellidos"
                  type="text"
                  class="input"
                  :placeholder="t('profile.lastNamePlaceholder')"
                />
              </div>
            </div>

            <!-- Email (solo lectura) -->
            <div class="input-group">
              <label class="label">{{ t('profile.email') }}</label>
              <input
                :value="authStore.usuario?.email"
                type="email"
                class="input input--readonly"
                readonly
                tabindex="-1"
              />
              <span class="input-hint">{{ t('profile.emailReadOnly') }}</span>
            </div>

            <!-- Fecha de nacimiento -->
            <div class="input-group">
              <label class="label">{{ t('profile.birthdate') }}</label>
              <DatePicker
                v-model="form.fecha_nacimiento"
                :placeholder="t('profile.birthdate')"
                :max-date="new Date().toISOString().split('T')[0]"
              />
              <span class="input-hint">{{ t('profile.birthdateTip') }}</span>
            </div>

            <!-- Teléfono + Ciudad -->
            <div class="form-row">
              <div class="input-group">
                <label class="label">{{ t('profile.phone') }}</label>
                <input
                  v-model="form.telefono"
                  type="tel"
                  class="input"
                  placeholder="+34 612 345 678"
                />
              </div>
              <div class="input-group">
                <label class="label">{{ t('profile.city') }}</label>
                <input
                  v-model="form.ciudad"
                  type="text"
                  class="input"
                  :placeholder="t('profile.cityPlaceholder')"
                />
              </div>
            </div>

            <!-- Acciones -->
            <div class="pf-actions">
              <button
                class="btn btn-teal"
                :disabled="guardando"
                @click="guardar"
              >
                <span v-if="guardando" class="spinner" style="width:15px;height:15px;border-width:2px"/>
                <span v-else>{{ t('profile.saveChanges') }}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>

    <!-- Modal de recorte — reutiliza CropModal de mascotas -->
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
.pf-page {
  padding-top: var(--page-padding-y);
  padding-bottom: 3rem;
}

.pf-head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 2rem;
}
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

/* ── Layout 2 columnas ───────────────────────────────────────── */
.pf-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.75rem;
  align-items: start;
}

/* ── Sidebar: avatar card ────────────────────────────────────── */
.pf-avatar-card { box-shadow: var(--shadow-card); }

.pf-avatar-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem 1.5rem;
  text-align: center;
}

/* Avatar circular con botón de cámara */
.pf-avatar-wrap {
  position: relative;
  display: inline-block;
}

.pf-avatar-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--color-primary-light);
  border: 3px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(240,130,99,0.25);
}

.pf-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pf-avatar-initials {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 2rem;
  color: var(--color-primary-dark);
}

/* Botón cámara superpuesto */
.pf-avatar-change {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(124,203,194,0.5);
  transition: background var(--transition-fast), transform var(--transition-fast);
}
.pf-avatar-change:hover {
  background: var(--color-teal-dark);
  transform: scale(1.1);
}

.hidden-input { display: none; }

.pf-nombre {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
  word-break: break-word;
}

.pf-email {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
  word-break: break-all;
}

/* ── Formulario card ─────────────────────────────────────────── */
.pf-form-card { box-shadow: var(--shadow-md); }

.pf-form-body { padding: 1.75rem 2rem; }

.pf-section-title {
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
}

.pf-msg { margin-bottom: 1rem; }

.pf-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

/* Input solo lectura */
.input--readonly {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--color-surface-alt) !important;
}

/* Acciones */
.pf-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 700px) {
  .pf-layout {
    grid-template-columns: 1fr;
  }
  .pf-avatar-body {
    flex-direction: row;
    text-align: left;
    gap: 1.25rem;
    padding: 1.25rem 1.5rem;
  }
  .pf-avatar-circle { width: 72px; height: 72px; flex-shrink: 0; }
  .pf-avatar-initials { font-size: 1.5rem; }
}

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
  .pf-form-body { padding: 1.25rem; }
  .pf-avatar-body { flex-direction: column; align-items: center; text-align: center; }
}

/* ── Mejoras móvil ───────────────────────────────────────── */
@media (max-width: 768px) {
  .pf-grid { grid-template-columns: 1fr !important; }
  .input { font-size: 16px !important; }
  .btn[type="submit"], .btn-save { width: 100%; min-height: 50px; font-size: 1rem; }
}
</style>
