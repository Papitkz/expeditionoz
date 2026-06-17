<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSEO } from '@/composables/useSEO'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useCMS } from '@/composables/useCMS'
import PageHero from '@/components/PageHero.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import CtaSection from '@/components/home/CtaSection.vue'

useScrollReveal()

const route = useRoute()
const router = useRouter()
const { getBlogBySlug } = useCMS()

const post = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)

useSEO({
  title: computed(() => post.value ? `${post.value.title} — Expedition OZ` : 'Blog — Expedition OZ'),
  description: computed(() => post.value?.excerpt || 'Stories from Ningaloo Reef.'),
  path: computed(() => `/blog/${route.params.slug}`),
  type: 'article',
})

onMounted(async () => {
  const slug = route.params.slug as string
  const data = await getBlogBySlug(slug)
  if (!data) {
    notFound.value = true
  } else {
    post.value = data
  }
  loading.value = false
})

const goBack = () => router.push('/blog')

// Gallery lightbox
const lightboxOpen = ref(false)
const currentImage = ref(0)

const openLightbox = (index: number) => {
  currentImage.value = index
  lightboxOpen.value = true
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen" style="background: var(--color-ocean-950);">
      <v-progress-circular indeterminate color="var(--color-gold-400)" size="48" />
    </div>

    <!-- Not Found -->
    <div v-else-if="notFound" class="flex flex-col items-center justify-center min-h-screen gap-6" style="background: var(--color-ocean-950);">
      <p class="text-2xl" style="color: var(--color-sand-100);">Story not found.</p>
      <button class="btn-primary px-8 py-3" @click="goBack">← Back to Journal</button>
    </div>

    <!-- Post -->
    <div v-else>
      <!-- Hero -->
      <PageHero
        tag="Expedition Journal"
        :title="post.title"
        :subtitle="post.excerpt"
        :image="post.coverImageUrl || ''"
        :image-alt="post.title"
        height="60vh"
      >
        <template #default>
          <video
            v-if="post.coverVideoUrl"
            :src="post.coverVideoUrl"
            class="absolute inset-0 w-full h-full object-cover"
            autoplay
            muted
            loop
            playsinline
            preload="none"
          />
          <img
            v-else-if="post.coverImageUrl"
            :src="post.coverImageUrl"
            :alt="post.title"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <NoImagePlaceholder v-else class="absolute inset-0" />
        </template>
      </PageHero>

      <!-- Article body -->
      <section class="py-24 lg:py-32" style="background: var(--color-ocean-950);">
        <div class="container mx-auto px-6 lg:px-12 max-w-3xl">

          <!-- Meta -->
          <div class="flex items-center gap-4 mb-10" style="color: var(--color-gold-400); opacity: 0.75;">
            <span class="text-xs font-semibold tracking-widest uppercase" style="font-family: 'Montserrat', sans-serif;">
              {{ post.date || 'Recent' }}
            </span>
            <span class="w-5 h-px" style="background: var(--color-gold-400);"></span>
            <span class="text-xs tracking-widest uppercase" style="font-family: 'Montserrat', sans-serif;">
              {{ post.author || 'Expedition Team' }}
            </span>
          </div>

          <!-- Content -->
          <div
            v-if="post.content"
            class="blog-content prose"
            v-html="post.content"
          />
          <p v-else class="text-base" style="color: var(--color-sand-200); opacity: 0.7;">
            {{ post.excerpt }}
          </p>

          <!-- Tags -->
          <div v-if="post.tags?.length" class="flex flex-wrap gap-2 mt-12">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="px-3 py-1 text-xs tracking-widest uppercase"
              style="font-family: 'Montserrat', sans-serif; border: 1px solid rgba(201,168,76,0.2); color: var(--color-gold-400); opacity: 0.7;"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Gallery -->
          <div v-if="post.gallery?.length" class="mt-16">
            <h3 class="text-sm tracking-widest uppercase mb-6" style="font-family: 'Montserrat', sans-serif; color: var(--color-gold-400); opacity: 0.75;">
              Gallery
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="(img, i) in post.gallery"
                :key="i"
                class="relative overflow-hidden cursor-pointer"
                style="height: 180px;"
                @click="openLightbox(i as number)"
              >
                <img
                  :src="img.url || img"
                  :alt="img.caption || `Gallery image ${(i as number) + 1}`"
                  class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>

          <!-- Back link -->
          <div class="mt-16 pt-8" style="border-top: 1px solid rgba(201,168,76,0.1);">
            <button
              class="flex items-center gap-3 text-xs tracking-widest uppercase transition-opacity hover:opacity-100"
              style="font-family: 'Montserrat', sans-serif; color: var(--color-gold-400); opacity: 0.6;"
              @click="goBack"
            >
              <v-icon size="14">mdi-arrow-left</v-icon>
              Back to Journal
            </button>
          </div>
        </div>
      </section>

      <!-- <CtaSection /> -->
    </div>

    <!-- Lightbox -->
    <v-dialog v-model="lightboxOpen" max-width="900">
      <div class="relative" style="background: #000;">
        <img
          v-if="post?.gallery?.[currentImage]"
          :src="post.gallery[currentImage].url || post.gallery[currentImage]"
          class="w-full"
          style="max-height: 80vh; object-fit: contain;"
        />
        <button
          class="absolute top-3 right-3 text-white opacity-70 hover:opacity-100"
          @click="lightboxOpen = false"
        >
          <v-icon>mdi-close</v-icon>
        </button>
        <button
          v-if="currentImage > 0"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100"
          @click="currentImage--"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </button>
        <button
          v-if="post?.gallery && currentImage < post.gallery.length - 1"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100"
          @click="currentImage++"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </button>
      </div>
    </v-dialog>
  </div>
</template>

<style scoped>
.blog-content {
  color: var(--color-sand-200);
  font-size: 1rem;
  line-height: 1.8;
}

.blog-content :deep(h2),
.blog-content :deep(h3) {
  font-family: var(--font-display);
  color: var(--color-sand-100);
  margin-top: 2em;
  margin-bottom: 0.5em;
}

.blog-content :deep(p) {
  margin-bottom: 1.4em;
  opacity: 0.85;
}

.blog-content :deep(a) {
  color: var(--color-gold-400);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.blog-content :deep(img) {
  width: 100%;
  border-radius: 2px;
  margin: 2em 0;
}

.blog-content :deep(blockquote) {
  border-left: 2px solid var(--color-gold-400);
  padding-left: 1.5em;
  opacity: 0.75;
  font-style: italic;
  margin: 2em 0;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 1.4em;
  opacity: 0.85;
}
</style>