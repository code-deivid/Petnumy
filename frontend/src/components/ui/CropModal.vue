<!-- src/components/ui/CropModal.vue -->
<!-- Modal de recorte circular con Canvas API nativo — sin librerías -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  imageSrc: { type: String, default: '' },
  visible:  { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])

const canvasRef  = ref(null)
const wrapRef    = ref(null)

// Estado del recorte
const state = ref({
  scale:     1,
  minScale:  1,
  offsetX:   0,
  offsetY:   0,
  dragging:  false,
  startX:    0,
  startY:    0
})

const img = new Image()
let canvasSize = 320

function initCanvas() {
  if (!canvasRef.value || !props.imageSrc) return
  const canvas = canvasRef.value
  const ctx    = canvas.getContext('2d')
  canvas.width  = canvasSize
  canvas.height = canvasSize

  img.onload = () => {
    // Calcular escala mínima para que llene el círculo
    const minS = Math.max(canvasSize / img.naturalWidth, canvasSize / img.naturalHeight)
    state.value.minScale = minS
    state.value.scale    = minS
    // Centrar
    state.value.offsetX = (canvasSize - img.naturalWidth  * minS) / 2
    state.value.offsetY = (canvasSize - img.naturalHeight * minS) / 2
    draw(ctx)
  }
  img.src = props.imageSrc
}

function draw(ctx) {
  if (!ctx || !img.complete) return
  const { scale, offsetX, offsetY } = state.value
  ctx.clearRect(0, 0, canvasSize, canvasSize)

  // Máscara circular
  ctx.save()
  ctx.beginPath()
  ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(img, offsetX, offsetY, img.naturalWidth * scale, img.naturalHeight * scale)
  ctx.restore()

  // Borde circular decorativo
  ctx.beginPath()
  ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 1, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(124,203,194,0.6)'
  ctx.lineWidth   = 2.5
  ctx.stroke()
}

function redraw() {
  if (!canvasRef.value) return
  draw(canvasRef.value.getContext('2d'))
}

// Arrastrar
function onMouseDown(e) {
  e.preventDefault()
  const { clientX, clientY } = e.touches ? e.touches[0] : e
  state.value.dragging = true
  state.value.startX   = clientX - state.value.offsetX
  state.value.startY   = clientY - state.value.offsetY
}

function onMouseMove(e) {
  if (!state.value.dragging) return
  e.preventDefault()
  const { clientX, clientY } = e.touches ? e.touches[0] : e
  const { scale, minScale } = state.value
  const w = img.naturalWidth  * scale
  const h = img.naturalHeight * scale

  let nx = clientX - state.value.startX
  let ny = clientY - state.value.startY

  // Limitar para que no salga del círculo
  nx = Math.min(0, Math.max(canvasSize - w, nx))
  ny = Math.min(0, Math.max(canvasSize - h, ny))

  state.value.offsetX = nx
  state.value.offsetY = ny
  redraw()
}

function onMouseUp() { state.value.dragging = false }

// Zoom con rueda
function onWheel(e) {
  e.preventDefault()
  const delta     = e.deltaY > 0 ? -0.05 : 0.05
  const newScale  = Math.max(state.value.minScale, Math.min(4, state.value.scale + delta))
  const factor    = newScale / state.value.scale
  state.value.scale   = newScale
  state.value.offsetX = canvasSize / 2 - factor * (canvasSize / 2 - state.value.offsetX)
  state.value.offsetY = canvasSize / 2 - factor * (canvasSize / 2 - state.value.offsetY)

  // Reclamp
  const w = img.naturalWidth  * newScale
  const h = img.naturalHeight * newScale
  state.value.offsetX = Math.min(0, Math.max(canvasSize - w, state.value.offsetX))
  state.value.offsetY = Math.min(0, Math.max(canvasSize - h, state.value.offsetY))
  redraw()
}

function onZoom(dir) {
  const delta = dir === '+' ? 0.1 : -0.1
  const newScale = Math.max(state.value.minScale, Math.min(4, state.value.scale + delta))
  const factor   = newScale / state.value.scale
  state.value.scale   = newScale
  state.value.offsetX = canvasSize / 2 - factor * (canvasSize / 2 - state.value.offsetX)
  state.value.offsetY = canvasSize / 2 - factor * (canvasSize / 2 - state.value.offsetY)
  const w = img.naturalWidth  * newScale
  const h = img.naturalHeight * newScale
  state.value.offsetX = Math.min(0, Math.max(canvasSize - w, state.value.offsetX))
  state.value.offsetY = Math.min(0, Math.max(canvasSize - h, state.value.offsetY))
  redraw()
}

// Confirmar: exportar canvas como dataURL
function confirmar() {
  const canvas = canvasRef.value
  const out    = document.createElement('canvas')
  out.width    = 300
  out.height   = 300
  const ctx    = out.getContext('2d')

  // Máscara circular en el canvas de salida
  ctx.beginPath()
  ctx.arc(150, 150, 150, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(canvas, 0, 0, canvasSize, canvasSize, 0, 0, 300, 300)

  emit('confirm', out.toDataURL('image/jpeg', 0.92))
}

watch(() => props.visible, (v) => { if (v) setTimeout(initCanvas, 50) })

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup',   onMouseUp)
  document.addEventListener('touchmove', onMouseMove, { passive: false })
  document.addEventListener('touchend',  onMouseUp)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup',   onMouseUp)
  document.removeEventListener('touchmove', onMouseMove)
  document.removeEventListener('touchend',  onMouseUp)
})
</script>

<template>
  <Transition name="crop-modal">
    <div v-if="visible" class="crop-overlay" @click.self="$emit('cancel')">
      <div class="crop-modal">

        <!-- Header -->
        <div class="crop-header">
          <h3 class="crop-title">Ajusta la foto</h3>
          <p class="crop-subtitle">Arrastra para centrar · Rueda para hacer zoom</p>
        </div>

        <!-- Canvas circular -->
        <div class="crop-canvas-wrap">
          <canvas
            ref="canvasRef"
            class="crop-canvas"
            @mousedown="onMouseDown"
            @touchstart.prevent="onMouseDown"
            @wheel.prevent="onWheel"
          />
        </div>

        <!-- Controles de zoom -->
        <div class="crop-zoom">
          <button type="button" class="zoom-btn" @click="onZoom('-')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div class="zoom-track">
            <div class="zoom-fill" :style="{ width: ((state.scale - state.minScale) / (4 - state.minScale) * 100) + '%' }" />
          </div>
          <button type="button" class="zoom-btn" @click="onZoom('+')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <!-- Botones -->
        <div class="crop-actions">
          <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Cancelar</button>
          <button type="button" class="btn btn-teal"  @click="confirmar">Usar foto</button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay ─────────────────────────────────────────────────── */
.crop-overlay {
  position: fixed;
  inset: 0;
  background: rgba(60, 46, 31, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* ── Modal ───────────────────────────────────────────────────── */
.crop-modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: var(--shadow-xl);
}

.crop-header { text-align: center; }
.crop-title  { font-size: 1.15rem; margin-bottom: 0.2rem; }
.crop-subtitle {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Canvas */
.crop-canvas-wrap {
  display: flex;
  justify-content: center;
}

.crop-canvas {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  cursor: grab;
  display: block;
  box-shadow: 0 4px 20px rgba(60,46,31,0.15);
}
.crop-canvas:active { cursor: grabbing; }

/* Zoom */
.crop-zoom {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.zoom-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-soft);
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
.zoom-btn:hover { background: var(--color-teal-light); color: var(--color-teal-dark); }

.zoom-track {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.zoom-fill {
  height: 100%;
  background: var(--color-teal);
  border-radius: var(--radius-full);
  transition: width var(--transition-fast);
}

/* Acciones */
.crop-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Animación del modal */
.crop-modal-enter-active,
.crop-modal-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}
.crop-modal-enter-from,
.crop-modal-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(10px);
}
</style>
