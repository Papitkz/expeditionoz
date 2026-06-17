<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useCMS } from '@/composables/useCMS'
import { useComponentCMS } from '@/composables/useComponentCMS'
import PageHero from '@/components/PageHero.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useRouter } from 'vue-router'

useScrollReveal()

useSEO({
  title: 'Blog — Expedition OZ',
  description: 'Stories, guides, and insights from Ningaloo Reef. Read about whale shark encounters, marine conservation, and life aboard our luxury vessels.',
  path: '/blog',
  type: 'article',
})

const blogs = ref<any[]>([])
const loading = ref(true)
const router = useRouter()
const { getBlogs } = useCMS()

const heroCms = useComponentCMS('BlogListView')
const heroImage = computed(() => heroCms.getImageUrl('hero', 0))
const heroVideo = computed(() => heroCms.getImageUrl('hero', 1))

onMounted(async () => {
  blogs.value = await getBlogs()
  loading.value = false
  await heroCms.load()
})

const goToBlog = (slug: string) => {
  router.push(`/blog/${slug}`)
}
</script>

<template>
  <div>
    <PageHero
      tag="Stories & Insights"
      title="Expedition"
      title-italic="Journal"
      subtitle="Tales from the reef, marine conservation updates, and guides for your next adventure."
      image=""
      image-alt="Ningaloo Reef blog"
      height="50vh"
    >
      <template #default>
        <!-- Video takes priority if present -->
        <template v-if="heroVideo">
          <video
            :src="heroVideo"
            class="absolute inset-0 w-full h-full object-cover"
            autoplay
            muted
            loop
            playsinline
            preload="none"
          />
        </template>
        <!-- Fallback to image -->
        <template v-else-if="heroImage">
          <img
            :src="heroImage"
            alt="Ningaloo Reef blog"
            class="absolute inset-0 w-full h-full object-cover"
          />
        </template>
        <NoImagePlaceholder v-else class="absolute inset-0" />
      </template>
    </PageHero>

    <section class="py-24 lg:py-32" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-6 lg:px-12 max-w-6xl">
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="var(--color-gold-400)" />
        </div>

        <v-row v-else dense class="blog-row">
          <v-col
            v-for="(item, index) in blogs"
            :key="index"
            cols="12"
            sm="6"
            md="4"
            class="blog-col"
          >
            <v-card
              class="blog-card"
              @click="goToBlog(item.slug)"
              hover
            >
              <!-- Image or Video Cover -->
              <div class="blog-image-wrap">
                <video
                  v-if="item.coverVideoUrl"
                  :src="item.coverVideoUrl"
                  class="blog-image"
                  muted
                  loop
                  preload="none"
                  @mouseenter="($event.target as HTMLVideoElement).play()"
                  @mouseleave="($event.target as HTMLVideoElement).pause()"
                />
                <img
                  v-else-if="item.coverImageUrl"
                  :src="item.coverImageUrl"
                  alt="Blog cover"
                  class="blog-image"
                  loading="lazy"
                />
                <NoImagePlaceholder v-else label="No Blog Image" class="h-full" />
                <!-- Media badges -->
                <div v-if="item.coverVideoUrl || item.gallery?.length" class="media-badges">
                  <span v-if="item.coverVideoUrl" class="media-badge video-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none"/>
                    </svg>
                    VIDEO
                  </span>
                  <span v-if="item.gallery?.length" class="media-badge gallery-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    {{ item.gallery.length }}
                  </span>
                </div>
              </div>

              <!-- Content -->
              <div class="blog-content">
                <div class="blog-meta mb-4">
                  <span class="meta-line"></span>
                  <span class="blog-date">{{ item.date || 'Recent' }}</span>
                </div>

                <h3 class="blog-title mb-4">
                  {{ item.title }}
                </h3>

                <p class="blog-excerpt mb-4">
                  {{ item.excerpt }}
                </p>

                <div class="blog-author mb-4">
                  <v-icon size="12" color="var(--color-sand-300)" class="mr-2">mdi-account-outline</v-icon>
                  {{ item.author || 'Expedition Team' }}
                </div>
              </div>

              <!-- Footer -->
              <div class="blog-footer">
                <div class="read-more">
                  <span>Read Story</span>
                  <v-icon size="14" class="read-arrow">mdi-arrow-right</v-icon>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="!loading && !blogs.length" class="text-center py-12">
          <p class="text-h6 white--text opacity-70">No stories yet. Check back soon!</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* === Row === */
.blog-row {
  display: flex;
  flex-wrap: wrap;
}

.blog-col {
  display: flex;
}

/* === Card === */
.blog-card {
  background: rgba(10, 46, 74, 0.2) !important;
  border: 1px solid rgba(201, 168, 76, 0.06) !important;
  border-radius: 0 !important;
  text-decoration: none;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.blog-card:hover {
  background: rgba(10, 46, 74, 0.35) !important;
  border-color: rgba(201, 168, 76, 0.15) !important;
  transform: translateY(-8px);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(201, 168, 76, 0.08) !important;
}

/* === Image === */
.blog-image-wrap {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  width: 100%;
  height: 240px;
  background: rgba(7, 26, 43, 0.5);
}

/* Media Badges */
.media-badges {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.media-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  backdrop-filter: blur(4px);
}

.video-badge {
  background: rgba(201, 168, 76, 0.85);
  color: #071a2b;
}

.gallery-badge {
  background: rgba(13, 110, 122, 0.85);
  color: #fff;
}

.blog-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  display: block;
}

.blog-card:hover .blog-image {
  transform: scale(1.06);
}

/* === Content === */
.blog-content {
  padding: 0;
  margin: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* === Meta === */
.blog-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meta-line {
  width: 20px;
  height: 1px;
  background: var(--color-gold-400);
  opacity: 0.4;
  transition: width 0.3s ease;
}

.blog-card:hover .meta-line {
  width: 30px;
  opacity: 0.6;
}

.blog-date {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-gold-400);
  opacity: 0.75;
}

/* === Title === */
.blog-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 300;
  line-height: 1.35;
  color: var(--color-sand-100);
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.2rem * 1.35 * 2);
}

/* === Excerpt === */
.blog-excerpt {
  font-size: 0.8rem;
  line-height: 1.65;
  color: var(--color-sand-200);
  opacity: 0.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(0.8rem * 1.65 * 3);
}

/* === Author === */
.blog-author {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  color: var(--color-sand-300);
  opacity: 0.45;
  display: flex;
  align-items: center;
  letter-spacing: 0.02em;
}

/* === Footer === */
.blog-footer {
  margin: 0 24px 24px 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(201, 168, 76, 0.08);
  flex-shrink: 0;
}

.read-more {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-gold-400);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.read-arrow {
  transition: transform 0.3s ease;
  opacity: 0.7;
}

.blog-card:hover .read-more {
  opacity: 1;
  gap: 12px;
}

.blog-card:hover .read-arrow {
  transform: translateX(4px);
  opacity: 1;
}
</style>