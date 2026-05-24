<script setup lang="ts">
defineProps<{
  tag?: string
  title: string
  titleItalic?: string
  subtitle?: string
  image: string
  imageAlt: string
  height?: string
}>()
</script>

<template>
  <section class="page-hero relative flex items-end overflow-hidden" :style="`min-height: ${height || '60vh'}`">
    <div class="hero-overlay absolute inset-0 z-10"></div>
    <slot>
      <img :src="image" :alt="imageAlt" class="absolute inset-0 w-full h-full object-cover" loading="eager" />
    </slot>
    <div class="relative z-20 w-full container mx-auto px-6 lg:px-12 pb-16 lg:pb-20">
      <p v-if="tag" class="overline-text mb-4">{{ tag }}</p>
      <div class="gold-divider-left mb-5"></div>
      <h1 class="font-display text-5xl md:text-7xl font-light leading-tight" style="font-family: var(--font-display); color: var(--color-sand-100);">
        {{ title }}
        <span v-if="titleItalic" class="italic block" style="color: var(--color-gold-400);">{{ titleItalic }}</span>
      </h1>
      <p v-if="subtitle" class="mt-4 max-w-2xl text-lg opacity-80" style="font-family: var(--font-display); color: var(--color-sand-200); font-style: italic; line-height: 1.7;">
        {{ subtitle }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.hero-overlay {
  background: linear-gradient(
    to top,
    rgba(7, 26, 43, 0.92) 0%,
    rgba(7, 26, 43, 0.45) 50%,
    rgba(7, 26, 43, 0.3) 100%
  );
}
</style>
