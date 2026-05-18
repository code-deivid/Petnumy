<!-- src/components/ui/AppToggle.vue -->
<!-- Toggle switch custom — estilo Petnumy -->
<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label:      { type: String,  default: '' },
  sublabel:   { type: String,  default: '' }
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="toggle-wrap">
    <div class="toggle-text" v-if="label">
      <span class="toggle-label">{{ label }}</span>
      <span v-if="sublabel" class="toggle-sublabel">{{ sublabel }}</span>
    </div>
    <div
      class="toggle-track"
      :class="{ 'toggle-track--on': modelValue }"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <div class="toggle-thumb" />
    </div>
  </label>
</template>

<style scoped>
.toggle-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.toggle-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text);
}

.toggle-sublabel {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.toggle-track {
  width: 44px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  position: relative;
  flex-shrink: 0;
  transition: background var(--transition-normal);
  box-shadow: inset 0 1px 3px rgba(60,46,31,0.12);
}

.toggle-track--on {
  background: var(--color-teal);
  box-shadow: inset 0 1px 3px rgba(124,203,194,0.3), 0 0 0 3px rgba(124,203,194,0.15);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(60,46,31,0.18);
  transition: transform var(--transition-normal);
}

.toggle-track--on .toggle-thumb {
  transform: translateX(20px);
}
</style>
