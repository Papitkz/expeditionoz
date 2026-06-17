z<!-- WaveDivider.vue - Simple section divider -->
<template>
  <div class="wave-divider" :class="`wave-${direction}`">
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
      <path 
        :fill="color"
        d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  direction?: 'up' | 'down'
  color?: string
}>()
</script>

<style scoped>
.wave-divider {
  width: 100%;
  height: 120px;
  overflow: hidden;
  line-height: 0;
}

.wave-divider svg {
  width: 100%;
  height: 100%;
  display: block;
}

.wave-up {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .wave-divider {
    height: 60px;
  }
}
</style>