<!-- src/components/vacunas/ModalDetalleVacuna.vue -->
<!-- Modal informativo premium sobre una vacuna concreta -->
<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVacunaInfo, estadoConfig } from '@/data/vacunasInfo.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  vacuna:  { type: Object,  default: null  }   // objeto vacuna_mascota completo
})
const emit = defineEmits(['close'])
const { t, locale } = useI18n()
const dateLocale = computed(() => locale.value === 'en' ? 'en-US' : (locale.value === 'va' ? 'ca-ES' : 'es-ES'))

const info = computed(() => getVacunaInfo(props.vacuna?.vacuna?.nombre, locale.value))
const cfg  = computed(() => estadoConfig[props.vacuna?.estado] || estadoConfig.pendiente)
function estadoLabel(estado = '') {
  if (estado === 'puesta') return t('vaccines.statusDone')
  if (estado === 'pendiente') return t('vaccines.statusPending')
  if (estado === 'retrasada') return t('vaccines.statusLate')
  return estado || ''
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(dateLocale.value, { day: 'numeric', month: 'long', year: 'numeric' })
}

// Días restantes o transcurridos
const diasInfo = computed(() => {
  if (!props.vacuna?.proxima_aplicacion) return null
  const diff = Math.ceil((new Date(props.vacuna.proxima_aplicacion) - Date.now()) / (1000*60*60*24))
  if (diff > 0)  return { texto: t('petDetail.daysLeft', { n: diff }), positivo: true }
  if (diff === 0) return { texto: t('petDetail.today'), positivo: true }
  return { texto: t('petDetail.overdueDays', { n: Math.abs(diff) }), positivo: false }
})

watch(() => props.visible, v => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="mdv-overlay" @click.self="$emit('close')">
      <Transition name="modal-slide">
        <div v-if="visible" class="mdv-modal card">

          <!-- Header -->
          <div class="mdv-header">
            <div class="mdv-header-icon">
              <Icon :icon="info?.icon || $icons.vaccine" width="22" height="22" />
            </div>
            <div class="mdv-header-text">
              <h3 class="mdv-title">{{ info?.enfermedad || vacuna?.vacuna?.nombre || t('petDetail.colVaccine') }}</h3>
              <span
                class="mdv-badge"
                :style="{ background: cfg.bg, color: cfg.color }"
              >{{ estadoLabel(vacuna?.estado) }}</span>
            </div>
            <button type="button" class="mdv-close" @click="$emit('close')">
              <Icon :icon="$icons.close" width="14" height="14" />
            </button>
          </div>

          <div class="mdv-body">

            <!-- Fechas -->
            <div class="mdv-fechas">
              <div class="mdv-fecha-item">
                <span class="mdv-fecha-label">{{ t('petDetail.colLastDose') }}</span>
                <span class="mdv-fecha-val">{{ fmt(vacuna?.fecha_aplicacion) }}</span>
              </div>
              <div class="mdv-fecha-sep" />
              <div class="mdv-fecha-item">
                <span class="mdv-fecha-label">{{ t('petDetail.colNextDose') }}</span>
                <span class="mdv-fecha-val" :style="{ color: diasInfo?.positivo === false ? 'var(--color-danger)' : '' }">
                  {{ fmt(vacuna?.proxima_aplicacion) }}
                </span>
                <span v-if="diasInfo" class="mdv-dias" :class="{ 'mdv-dias--alert': !diasInfo.positivo }">
                  {{ diasInfo.texto }}
                </span>
              </div>
            </div>

            <!-- Info educativa (si existe) -->
            <template v-if="info">

              <div class="mdv-section">
                <p class="mdv-section-label">{{ t('petDetail.whatDisease') }}</p>
                <p class="mdv-section-text">{{ info.enfermedad }}</p>
              </div>

              <div class="mdv-section">
                <p class="mdv-section-label">{{ t('petDetail.description') }}</p>
                <p class="mdv-section-text">{{ info.descripcionLarga }}</p>
              </div>

              <div class="mdv-section">
                <p class="mdv-section-label">{{ t('petDetail.symptoms') }}</p>
                <p class="mdv-section-text">{{ info.sintomas }}</p>
              </div>

              <!-- {{ t('petDetail.description') }} del backend (más detallada que el catálogo local) -->
              <div v-if="locale === 'es' && vacuna?.vacuna?.descripcion" class="mdv-section">
                <p class="mdv-section-label">{{ t('petDetail.fullDescription') }}</p>
                <p class="mdv-section-text">{{ vacuna.vacuna.descripcion }}</p>
              </div>

              <div class="mdv-row-2">
                <div class="mdv-section mdv-section--card">
                  <p class="mdv-section-label">{{ t('petDetail.frequency') }}</p>
                  <p class="mdv-section-text">{{ info.frecuencia }}</p>
                </div>
                <div class="mdv-section mdv-section--card">
                  <p class="mdv-section-label">{{ t('petDetail.riskLevel') }}</p>
                  <span
                    class="mdv-riesgo"
                    :class="`mdv-riesgo--${info.riesgo}`"
                  >{{ t(`petDetail.risk.${info.riesgo}`) }}</span>
                </div>
              </div>

            </template>

            <!-- Sin info del catálogo local → usar descripción del backend directamente -->
            <div v-else class="mdv-section">
              <p class="mdv-section-label">{{ t('petDetail.description') }}</p>
              <p class="mdv-section-text">
                {{ vacuna?.vacuna?.descripcion || t('petDetail.noAdditionalInfo') }}
              </p>
            </div>

          </div>

          <div class="mdv-footer">
            <button type="button" class="btn btn-teal" @click="$emit('close')">{{ t('common.close') }}</button>
          </div>

        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.mdv-overlay {
  position: fixed; inset: 0;
  background: rgba(30, 20, 14, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.mdv-modal {
  width: 100%; max-width: 480px;
  max-height: 88vh; overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-xl);
}

/* Header */
.mdv-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.mdv-header-icon {
  width: 44px; height: 44px; border-radius: var(--radius-md);
  background: var(--color-teal-light);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  color: var(--color-teal-dark);
}
.mdv-header-text { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
.mdv-title { font-size: 1rem; margin: 0; }
.mdv-badge {
  display: inline-block; padding: 0.18rem 0.65rem;
  border-radius: var(--radius-full); font-family: var(--font-display);
  font-weight: 700; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.4px;
  width: fit-content;
}
.mdv-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--color-surface-alt); color: var(--color-text-soft);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background var(--transition-fast);
}
.mdv-close:hover { background: var(--color-danger-light); color: var(--color-danger); }

/* Body */
.mdv-body {
  flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; gap: 1rem;
}

/* Fechas */
.mdv-fechas {
  display: flex; align-items: stretch; gap: 0;
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.mdv-fecha-item {
  flex: 1; padding: 0.85rem 1rem;
  display: flex; flex-direction: column; gap: 0.2rem;
}
.mdv-fecha-sep { width: 1px; background: var(--color-border); flex-shrink: 0; }
.mdv-fecha-label { font-family: var(--font-display); font-weight: 700; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
.mdv-fecha-val   { font-family: var(--font-display); font-weight: 700; font-size: 0.875rem; color: var(--color-text); }
.mdv-dias        { font-size: 0.72rem; color: var(--color-teal-dark); font-weight: 600; }
.mdv-dias--alert { color: var(--color-danger); }

/* Secciones */
.mdv-section-label { font-family: var(--font-display); font-weight: 700; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.6px; color: var(--color-teal-dark); margin-bottom: 0.3rem; }
.mdv-section-text  { font-size: 0.84rem; color: var(--color-text-soft); line-height: 1.55; margin: 0; }

.mdv-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.mdv-section--card {
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  padding: 0.85rem;
}

/* Riesgo */
.mdv-riesgo {
  display: inline-block; padding: 0.25rem 0.75rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700; font-size: 0.78rem;
}
.mdv-riesgo--alto   { background: var(--color-danger-light); color: var(--color-danger); }
.mdv-riesgo--medio  { background: #FEF9E7; color: #9A6A10; }
.mdv-riesgo--bajo   { background: var(--color-teal-light); color: var(--color-teal-dark); }

.mdv-no-info { font-size: 0.85rem; color: var(--color-text-muted); padding: 0.5rem 0; }

/* Footer */
.mdv-footer {
  display: flex; justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* Animaciones */
.modal-fade-enter-active, .modal-fade-leave-active   { transition: opacity var(--transition-normal); }
.modal-fade-enter-from, .modal-fade-leave-to         { opacity: 0; }
.modal-slide-enter-active, .modal-slide-leave-active { transition: opacity var(--transition-normal), transform var(--transition-normal); }
.modal-slide-enter-from, .modal-slide-leave-to       { opacity: 0; transform: scale(0.96) translateY(10px); }

@media (max-width: 540px) {
  .mdv-modal   { max-height: 92vh; border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  .mdv-overlay { align-items: flex-end; padding: 0; }
  .mdv-row-2   { grid-template-columns: 1fr; }
}
</style>
