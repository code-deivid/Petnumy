<!-- src/components/ui/PetAvatar.vue -->
<!--
  Avatar reutilizable para usuarios y mascotas.
  Si hay foto: muestra la imagen.
  Si no: muestra iniciales bonitas con fondo contextual.

  Props:
  - foto:   string|null   URL de la foto
  - nombre: string        Nombre (para iniciales)
  - tipo:   'usuario'|'mascota'  contexto visual
  - genero: 'macho'|'hembra'|null  solo para mascotas
  - size:   'xs'|'sm'|'md'|'lg'|'xl'  — default 'md'

  Tamaños:
  xs → 28px  (mini chips, tablas)
  sm → 36px  (listas compactas)
  md → 52px  (cards estándar)
  lg → 72px  (hero, detalle)
  xl → 96px  (perfil, settings)
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  foto:    { type: String,  default: null },
  nombre:  { type: String,  default: ''   },
  tipo:    { type: String,  default: 'mascota' }, // 'usuario' | 'mascota'
  genero:  { type: String,  default: null },      // 'macho' | 'hembra' | null
  size:    { type: String,  default: 'md'  },
})

// Iniciales — hasta 2 letras
const iniciales = computed(() => {
  const partes = (props.nombre || '').trim().split(/\s+/)
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  return (partes[0]?.[0] || '?').toUpperCase()
})

// Clase de tamaño
const sizeClass = computed(() => `pav--${props.size}`)

// Clase de color según contexto
const colorClass = computed(() => {
  if (props.tipo === 'usuario') return 'pav--usuario'
  if (props.genero === 'macho')  return 'pav--macho'
  if (props.genero === 'hembra') return 'pav--hembra'
  return 'pav--neutral'
})

// Tamaño de fuente proporcional al tamaño del avatar
const fontSize = computed(() => {
  const map = { xs: '0.62rem', sm: '0.78rem', md: '1.1rem', lg: '1.5rem', xl: '2rem' }
  return map[props.size] || '1.1rem'
})
</script>

<template>
  <div class="pav" :class="[sizeClass, colorClass, { 'pav--has-foto': !!foto }]">
    <!-- Foto real -->
    <img
      v-if="foto"
      :src="foto"
      :alt="nombre"
      class="pav-img"
      loading="lazy"
    />
    <!-- Placeholder con iniciales -->
    <span v-else class="pav-iniciales" :style="{ fontSize }">
      {{ iniciales }}
    </span>
  </div>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────────────────── */
.pav {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(60,46,31,0.12);
  transition: box-shadow var(--transition-fast);
}

/* ── Tamaños ─────────────────────────────────────────────────── */
.pav--xs { width: 28px;  height: 28px; }
.pav--sm { width: 36px;  height: 36px; }
.pav--md { width: 52px;  height: 52px; }
.pav--lg { width: 72px;  height: 72px; }
.pav--xl { width: 96px;  height: 96px; }

/* ── Foto ────────────────────────────────────────────────────── */
.pav-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ── Iniciales ───────────────────────────────────────────────── */
.pav-iniciales {
  font-family: var(--font-display);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.5px;
}

/* ── Colores ─────────────────────────────────────────────────── */

/* Usuario: coral suave */
.pav--usuario {
  background: linear-gradient(135deg, #F5C4B4, #EDAA94);
  border: 2px solid rgba(240,130,99,0.2);
}
.pav--usuario .pav-iniciales { color: #A84020; }

/* Mascota macho: azul pastel cálido */
.pav--macho {
  background: linear-gradient(135deg, #C4D8F0, #A8C4E8);
  border: 2px solid rgba(100,160,220,0.25);
}
.pav--macho .pav-iniciales { color: #2A5A90; }

/* Mascota hembra: rosa pastel */
.pav--hembra {
  background: linear-gradient(135deg, #F0C4D8, #E8A8C4);
  border: 2px solid rgba(200,100,160,0.25);
}
.pav--hembra .pav-iniciales { color: #8A2050; }

/* Neutral: beige premium */
.pav--neutral {
  background: linear-gradient(135deg, var(--color-surface-alt), var(--color-surface-warm));
  border: 2px solid var(--color-border);
}
.pav--neutral .pav-iniciales { color: var(--color-text-soft); }

/* ── Dark mode ───────────────────────────────────────────────── */
:global(html.dark) .pav--usuario,
:global(html[data-theme="dark"]) .pav--usuario {
  background: linear-gradient(135deg, #5A2A1E, #7A3828);
  border-color: rgba(240,130,99,0.25);
}
:global(html.dark) .pav--usuario .pav-iniciales,
:global(html[data-theme="dark"]) .pav--usuario .pav-iniciales {
  color: #F5A882;
}

:global(html.dark) .pav--macho,
:global(html[data-theme="dark"]) .pav--macho {
  background: linear-gradient(135deg, #1A2E45, #243D5A);
  border-color: rgba(100,160,220,0.2);
}
:global(html.dark) .pav--macho .pav-iniciales,
:global(html[data-theme="dark"]) .pav--macho .pav-iniciales {
  color: #7BAFD4;
}

:global(html.dark) .pav--hembra,
:global(html[data-theme="dark"]) .pav--hembra {
  background: linear-gradient(135deg, #45182C, #5A2038);
  border-color: rgba(200,100,160,0.2);
}
:global(html.dark) .pav--hembra .pav-iniciales,
:global(html[data-theme="dark"]) .pav--hembra .pav-iniciales {
  color: #D47BA8;
}

:global(html.dark) .pav--neutral,
:global(html[data-theme="dark"]) .pav--neutral {
  background: linear-gradient(135deg, var(--color-surface-alt), var(--color-surface-warm));
  border-color: var(--color-border);
}
</style>
