<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getEditableContent } from '@/composables/usePageContent'

const props = defineProps<{
  page: string
  section: string
  contentKey: string
  fallback?: string
  tag?: string
}>()

const value = ref<string | null>(null)

async function load() {
  value.value = await getEditableContent(props.page, props.section, props.contentKey, props.fallback ?? '')
}

onMounted(load)
watch(() => [props.page, props.section, props.contentKey], load)
</script>

<template>
  <component :is="tag || 'span'" v-if="value">{{ value }}</component>
  <component :is="tag || 'span'" v-else><slot /></component>
</template>
