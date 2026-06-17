<template>
  <div class="no-image-placeholder" :class="{ 'dark': dark }">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
    </svg>
    <p class="no-image-text">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  dark?: boolean
}>()
</script>

<style scoped>
.no-image-placeholder {
  width: 100%;
  height: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(7, 26, 43, 0.6);
  border: 1px dashed rgba(201, 168, 76, 0.2);
  color: rgba(201, 168, 76, 0.4);
  padding: 2rem;
}

.no-image-placeholder.dark {
  background: rgba(7, 26, 43, 0.9);
  border-color: rgba(201, 168, 76, 0.15);
}

.no-image-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.3);
}
</style>
