<!-- src/components/ui/PetAvatar.vue -->
<!--
  Avatar limpio para usuarios y mascotas.
  UN solo círculo — sin wrappers, sin fondos duplicados.

  Props:
  - foto:   string|null
  - nombre: string
  - tipo:   'usuario' | 'mascota'
  - genero: 'macho' | 'hembra' | null
  - size:   'xs' | 'sm' | 'md' | 'lg' | 'xl'
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  foto:   { type: String,  default: null },
  nombre: { type: String,  default: ''   },
  tipo:   { type: String,  default: 'mascota' },
  genero: { type: String,  default: null },
  size:   { type: String,  default: 'md' },
})

// Una sola inicial (nombre corto de mascota — no necesita 2 letras)
const inicial = computed(() =>
  (props.nombre || '').trim()[0]?.toUpperCase() || '?'
)

// Clases compuestas
const rootClass = computed(() => [
  'pav',
  `pav--${props.size}`,
  props.foto ? 'pav--foto' : `pav--${props.tipo === 'usuario' ? 'usuario' : (props.genero || 'neutral')}`,
])

// Font size según tamaño
const fs = computed(() => ({
  xs: '0.65rem', sm: '0.8rem', md: '1.1rem', lg: '1.6rem', xl: '2.1rem'
})[props.size] || '1.1rem')
</script>

<template>
  <div :class="rootClass">
    <img v-if="foto" :src="foto" :alt="nombre" class="pav-img" loading="lazy" />
    <span v-else class="pav-letra" :style="{ fontSize: fs }">{{ inicial }}</span>
  </div>
</template>

<style scoped>
/* ── Un único círculo ────────────────────────────────────────── */
.pav {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Sin box-shadow por defecto — los wrappers deciden si quieren sombra */
}

/* ── Tamaños ─────────────────────────────────────────────────── */
.pav--xs { width: 28px;  height: 28px; }
.pav--sm { width: 36px;  height: 36px; }
.pav--md { width: 52px;  height: 52px; }
.pav--lg { width: 72px;  height: 72px; }
.pav--xl { width: 100px; height: 100px; }

/* ── Foto ────────────────────────────────────────────────────── */
.pav-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}

/* ── Letra ───────────────────────────────────────────────────── */
.pav-letra {
  font-family: var(--font-display);
  font-weight: 800;
  line-height: 1;
  user-select: none;
}

/* ── Placeholder: usuario (coral) ────────────────────────────── */
.pav--usuario {
  background: #FBDDD3;
}
.pav--usuario .pav-letra { color: #C04A25; }

/* ── Placeholder: macho (azul pastel) ───────────────────────── */
.pav--macho {
  background: #D6E8F8;
}
.pav--macho .pav-letra { color: #2A5A90; }

/* ── Placeholder: hembra (rosa pastel) ──────────────────────── */
.pav--hembra {
  background: #FADDE9;
}
.pav--hembra .pav-letra { color: #8A2050; }

/* ── Placeholder: neutral (beige) ───────────────────────────── */
.pav--neutral {
  background: var(--color-surface-alt);
}
.pav--neutral .pav-letra { color: var(--color-text-soft); }

/* ── Dark mode ───────────────────────────────────────────────── */
:global(html.dark) .pav--usuario,
:global(html[data-theme="dark"]) .pav--usuario {
  background: #3D1A0E;
}
:global(html.dark) .pav--usuario .pav-letra,
:global(html[data-theme="dark"]) .pav--usuario .pav-letra {
  color: #FFA07A;
}

:global(html.dark) .pav--macho,
:global(html[data-theme="dark"]) .pav--macho {
  background: #112236;
}
:global(html.dark) .pav--macho .pav-letra,
:global(html[data-theme="dark"]) .pav--macho .pav-letra {
  color: #7BAFD4;
}

:global(html.dark) .pav--hembra,
:global(html[data-theme="dark"]) .pav--hembra {
  background: #2E0E1C;
}
:global(html.dark) .pav--hembra .pav-letra,
:global(html[data-theme="dark"]) .pav--hembra .pav-letra {
  color: #D47BA8;
}

:global(html.dark) .pav--neutral,
:global(html[data-theme="dark"]) .pav--neutral {
  background: var(--color-surface-alt);
}
:global(html.dark) .pav--neutral .pav-letra,
:global(html[data-theme="dark"]) .pav--neutral .pav-letra {
  color: var(--color-text-soft);
}
</style>
