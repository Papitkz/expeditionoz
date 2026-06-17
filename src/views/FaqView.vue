<script setup lang="ts">
import { useSEO, buildBreadcrumbSchema, buildFAQSchema } from '@/composables/useSEO'
import { ref, computed, onMounted } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import PageHero from '@/components/PageHero.vue'
import CtaSection from '@/components/home/CtaSection.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useComponentCMS } from '@/composables/useComponentCMS'

useScrollReveal()

const heroCms = useComponentCMS('FaqView')
const heroImage = computed(() => heroCms.getImageUrl('hero', 0))

const categories = [
  {
    title: 'Booking & Availability',
    faqs: [
      {
        q: 'How do I check availability and make a booking?',
        a: 'Contact our team via the enquiry form or by phone. We\'ll discuss available departure dates, confirm passenger numbers, and guide you through the booking process. A deposit secures your place.'
      },
      {
        q: 'How far in advance should I book?',
        a: 'We recommend booking 3–6 months in advance, particularly for peak season (March–August) when whale sharks are most reliably present. Popular departure dates fill quickly.'
      },
      {
        q: 'What is your cancellation policy?',
        a: 'Cancellations made more than 60 days before departure receive a full refund minus a small administration fee. Within 60 days, we offer a credit to re-book. We strongly recommend travel insurance.'
      },
      {
        q: 'Do you use FareHarbor or another booking system?',
        a: 'We use an integrated booking system that allows you to check live availability and secure your expedition online. Contact us and we\'ll send you a direct booking link.'
      },
    ]
  },
  {
    title: 'The Experience',
    faqs: [
      {
        q: 'Do I need to be an experienced snorkeler?',
        a: 'Not at all. Our expeditions welcome all abilities. Our marine naturalists provide full snorkeling instruction and will be with you in the water throughout every session.'
      },
      {
        q: 'Are whale shark encounters guaranteed?',
        a: 'Ningaloo has one of the highest rates of whale shark encounter success in the world. We use a spotter aircraft to locate whale sharks before entering the water. We are proud of our success rate, but as with all wildlife, encounters cannot be 100% guaranteed.'
      },
      {
        q: 'What wildlife might we see?',
        a: 'Beyond whale sharks, expect to encounter manta rays, humpback whales (seasonal), sea turtles, dugongs, reef sharks, dolphins, countless reef fish species, and extraordinary coral gardens.'
      },
      {
        q: 'What is the daily routine like on board?',
        a: 'Typically: early morning snorkel or dive, breakfast, mid-morning activity, lunch, afternoon exploration, sundowner drinks on deck, gourmet dinner, and stargazing. Each day is flexible based on wildlife and weather.'
      },
    ]
  },
  {
    title: 'Onboard Life',
    faqs: [
      {
        q: 'What is included in the price?',
        a: 'Everything. All meals and premium beverages, all snorkel equipment including wetsuits and fins, kayaks and paddleboards, marine naturalist guiding, spotter aircraft (whale shark season), and your cabin accommodation.'
      },
      {
        q: 'What are the cabins like?',
        a: 'Ocean Safari features comfortable shared and private cabin options. Dive Expedition offers premium en-suite cabin suites. All cabins are air-conditioned with quality bedding and storage.'
      },
      {
        q: 'What food and drinks are served?',
        a: 'Our onboard chef prepares fresh, seasonal cuisine for every meal. Expect seafood, contemporary Australian cooking, and generous wine and cocktail selections. Dietary requirements are catered for — please advise at booking.'
      },
      {
        q: 'Is there connectivity on board?',
        a: 'We intentionally operate in remote waters with limited connectivity. This is part of the experience — a genuine digital detox. Emergency satellite communication is always available.'
      },
    ]
  },
  {
    title: 'Practical Information',
    faqs: [
      {
        q: 'When is the best time to visit Ningaloo?',
        a: 'Whale sharks are present from approximately March to August, with peak season April–June. Manta rays are year-round. Humpback whales are seen July–October. We offer expeditions year-round with different seasonal highlights.'
      },
      {
        q: 'What should I bring?',
        a: 'Light clothing, swimwear, sun protection, hat, reef-safe sunscreen, a camera (underwater housing recommended), and seasickness medication if you\'re prone. A full packing list is sent with your booking confirmation.'
      },
      {
        q: 'How do I get to Exmouth?',
        a: 'Exmouth is serviced by regular flights from Perth (approx. 2 hours). We can assist with transfer recommendations and local accommodation for nights before or after your expedition.'
      },
      {
        q: 'Is Expedition OZ environmentally certified?',
        a: 'Yes. We hold marine park operating permits and operate under strict environmental guidelines. We contribute to reef monitoring programs and all our team are trained in responsible wildlife interaction.'
      },
    ]
  },
]

// Flatten all FAQs for schema
const allFaqs = categories.flatMap(cat => cat.faqs)

const openIndex = ref<number | null>(null)

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}

useSEO({
  title: 'FAQ — Ningaloo Reef Expedition Questions',
  description: 'Find answers about our luxury live-aboard expeditions in Ningaloo Reef. Booking, preparation, marine life encounters, and what to expect aboard Ocean Safari and Dive Expedition.',
  path: '/faq',
  type: 'article',
  jsonLd: [
    buildFAQSchema(allFaqs),
    buildBreadcrumbSchema([
      { name: 'Home', url: 'https://expeditionoz.netlify.app/' },
      { name: 'FAQ', url: 'https://expeditionoz.netlify.app/faq' },
    ])
  ]
})

onMounted(async () => {
  await heroCms.load()
})
</script>

<template>
  <div>
    <PageHero
      tag="Questions Answered"
      title="Frequently Asked"
      title-italic="Questions"
      subtitle="Everything you need to know before embarking on your Expedition OZ adventure."
      image=""
      image-alt="Clear turquoise waters of Ningaloo Reef"
      height="50vh"
    >
      <template #default>
        <template v-if="heroImage">
          <img
            :src="heroImage"
            alt="Clear turquoise waters of Ningaloo Reef"
            class="absolute inset-0 w-full h-full object-cover"
          />
        </template>
        <NoImagePlaceholder v-else class="absolute inset-0" />
      </template>
    </PageHero>

    <section class="py-24 lg:py-32" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-6 lg:px-12 max-w-4xl">
        <div 
          v-for="(cat, ci) in categories" 
          :key="cat.title" 
          class="mb-16 section-reveal" 
          :style="`transition-delay: ${ci * 0.1}s`"
        >
          <p class="overline-text mb-4">{{ cat.title }}</p>
          <div class="gold-divider-left mb-8"></div>

          <div class="space-y-0">
            <div 
              v-for="(faq, fi) in cat.faqs" 
              :key="faq.q" 
              class="faq-item"
            >
              <button
                class="faq-trigger"
                @click="toggle(ci * 100 + fi)"
                :aria-expanded="openIndex === ci * 100 + fi"
              >
                <span class="font-display text-xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100); text-align: left; line-height: 1.4;">
                  {{ faq.q }}
                </span>
                <span class="faq-icon" :class="{ 'rotated': openIndex === ci * 100 + fi }">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </button>

              <div class="faq-body" :class="{ 'faq-body-open': openIndex === ci * 100 + fi }">
                <p class="text-sm leading-relaxed opacity-80 pb-6 pt-1" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
                  {{ faq.a }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="section-reveal text-center mt-8 pt-8" style="border-top: 1px solid rgba(201, 168, 76, 0.15);">
          <p class="font-display text-2xl font-light mb-4" style="font-family: var(--font-display); color: var(--color-sand-100);">
            Still have questions?
          </p>
          <p class="text-sm opacity-70 mb-6" style="font-family: var(--font-body); color: var(--color-sand-200);">
            Our team is happy to help. Reach out anytime.
          </p>
          <router-link to="/contact" class="btn-primary">Contact Us</router-link>
        </div>
      </div>
    </section>

    <CtaSection />
  </div>
</template>

<style scoped>
.faq-item {
  border-top: 1px solid rgba(201, 168, 76, 0.12);
}

.faq-item:last-child {
  border-bottom: 1px solid rgba(201, 168, 76, 0.12);
}

.faq-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.faq-icon {
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.faq-icon.rotated {
  transform: rotate(180deg);
}

.faq-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease;
}

.faq-body-open {
  max-height: 300px;
}
</style>
