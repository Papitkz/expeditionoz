import { useHead, useSeoMeta } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { computed, unref, type MaybeRef } from 'vue'

interface SEOConfig {
  title?: MaybeRef<string | undefined>
  description?: MaybeRef<string | undefined>
  image?: MaybeRef<string | undefined>
  path?: MaybeRef<string | undefined>
  type?: MaybeRef<'website' | 'article' | 'product' | undefined>
  noindex?: MaybeRef<boolean | undefined>
  keywords?: MaybeRef<string[] | undefined>
  author?: MaybeRef<string | undefined>
  jsonLd?: Record<string, any> | Record<string, any>[]
  articlePublishedAt?: MaybeRef<string | undefined>
  articleModifiedAt?: MaybeRef<string | undefined>
  articleTags?: MaybeRef<string[] | undefined>
}

const SITE_NAME = 'Expedition OZ'
const SITE_URL = 'https://expeditionoz.netlify.app'
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  '/': 'Live-aboard expeditions through Ningaloo Reef, Western Australia. Swim with whale sharks, dive remote sites, and spend your nights anchored over some of the most intact coral in the world. Ocean Safari (6 days, from $2,495 AUD) and Dive Expedition (9 days, from $4,495 AUD). 2026 season open.',
  '/expeditions': 'Two live-aboard expeditions into Ningaloo Reef — Ocean Safari covers the northern reef in 6 days, Dive Expedition covers the full reef in 9. Both depart Exmouth, Western Australia. Small groups, full-reef access, all-inclusive.',
  '/expeditions/ocean-safari': 'Ocean Safari: 6-day northern Ningaloo Reef live-aboard. Maximum 12 guests. Whale shark encounters, guided snorkeling, all-inclusive meals and gear. From $2,495 AUD. Departing Exmouth, WA. Book 2026.',
  '/expeditions/dive-expedition': 'Dive Expedition: 9-day live-aboard covering the full length of Ningaloo Reef. Remote dive sites, whale shark swims, humpback whale encounters. From $4,495 AUD. Maximum 14 guests. 2026 departures open.',
  '/about': 'Expedition OZ runs small-group live-aboard expeditions through Ningaloo Marine Park, Western Australia. Learn about our vessels, crew, and approach to reef-safe operations since 2018.',
  '/contact': 'Get in touch with Expedition OZ. Phone, email, or WhatsApp. Based in Exmouth, Western Australia. We respond within 24 hours on business days.',
  '/faq': 'Questions about Ningaloo Reef live-aboards answered: what to pack, how to handle seasickness, dive certifications required, payment and cancellation terms, and best departure windows.',
  '/blog': 'Field notes, species guides, and stories from Ningaloo Reef. Whale shark encounters, reef conditions, crew perspectives, and what to expect on an Expedition OZ voyage.',
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'Expedition OZ',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Small-group live-aboard expeditions through Ningaloo Marine Park, Western Australia',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Exmouth',
      addressRegion: 'WA',
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -21.9315,
      longitude: 114.1280,
    },
    telephone: '+61-234-567-890',
    priceRange: '$$$$',
    sameAs: [
      'https://www.facebook.com/ExpeditionOz/',
      'https://instagram.com/ExpeditionOz',
    ],
  }
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildFAQSchema(questions: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.a,
      },
    })),
  }
}

export function buildArticleSchema(config: {
  title: string
  description: string
  image: string
  url: string
  publishedAt: string
  modifiedAt?: string
  author?: string
  tags?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: config.title,
    description: config.description,
    image: config.image,
    url: config.url,
    datePublished: config.publishedAt,
    dateModified: config.modifiedAt || config.publishedAt,
    author: {
      '@type': 'Person',
      name: config.author || 'Expedition OZ',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Expedition OZ',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    keywords: config.tags?.join(', ') || 'Ningaloo Reef, whale sharks, Western Australia',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': config.url,
    },
  }
}

export function buildProductSchema(config: {
  name: string
  description: string
  image: string
  price: string
  url: string
  ratingValue?: string
  reviewCount?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.name,
    description: config.description,
    image: config.image,
    brand: { '@type': 'Brand', name: 'Expedition OZ' },
    offers: {
      '@type': 'Offer',
      price: config.price,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-12-31',
      url: config.url,
    },
    ...(config.ratingValue && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: config.ratingValue,
        reviewCount: config.reviewCount || '93',
      },
    }),
  }
}

export function useSEO(config: SEOConfig = {}) {
  const route = useRoute()

  // Use computed + unref to handle both plain values and refs/computed
  const path = computed(() => unref(config.path) || route.path)
  const title = computed(() => {
    const t = unref(config.title)
    if (!t) return `${SITE_NAME} — Live-Aboard Expeditions, Ningaloo Reef`
    // Prevent double appending site name
    if (t.includes(SITE_NAME)) return t
    return `${t} | ${SITE_NAME}`
  })
  const description = computed(() => unref(config.description) || DEFAULT_DESCRIPTIONS[unref(path)] || DEFAULT_DESCRIPTIONS['/'])
  const canonical = computed(() => `${SITE_URL}${unref(path)}`)
  const ogImage = computed(() => unref(config.image) || DEFAULT_IMAGE)
  const ogType = computed(() => unref(config.type) || 'website')
  const robots = computed(() => unref(config.noindex) ? 'noindex, nofollow' : 'index, follow')
  const keywords = computed(() => unref(config.keywords)?.join(', ') || 'Ningaloo Reef, live-aboard expeditions, Exmouth Western Australia, whale sharks, reef diving, Ningaloo Marine Park, small group tours')
  const author = computed(() => unref(config.author) || 'Expedition OZ')

  useHead({
    meta: [
      { name: 'robots', content: robots },
      { name: 'googlebot', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'bingbot', content: 'index, follow' },
    ],
  })

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogImage: () => ogImage.value,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/jpeg',
    ogUrl: () => canonical.value,
    ogType: () => ogType.value as 'website' | 'article',
    ogSiteName: SITE_NAME,
    ogLocale: 'en_AU',
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: () => ogImage.value,
    twitterSite: '@ExpeditionOz',
    twitterCreator: '@ExpeditionOz',
    author: () => author.value,
    keywords: () => keywords.value,
    articlePublishedTime: () => unref(config.articlePublishedAt),
    articleModifiedTime: () => unref(config.articleModifiedAt),
    // FIX 1: Explicitly narrow type to ensure we return string[] | undefined
    articleAuthor: () => {
      const a = unref(config.author)
      return a ? [a] : undefined
    },
    articleTag: () => unref(config.articleTags),
    articleSection: 'Travel',
  })

  useHead({
    htmlAttrs: { lang: 'en-AU', dir: 'ltr' },
    link: [
      { rel: 'canonical', href: canonical },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
      { rel: 'dns-prefetch', href: 'https://cdn.freebiesupply.com' },
      { rel: 'alternate', hreflang: 'en-au', href: canonical },
      { rel: 'alternate', hreflang: 'x-default', href: () => `${SITE_URL}${unref(path)}` },
      { rel: 'sitemap', type: 'application/xml', href: `${SITE_URL}/sitemap.xml`, title: 'Sitemap' },
    ],
    meta: [
      { name: 'author', content: author },
      { name: 'theme-color', content: '#071a2b', media: '(prefers-color-scheme: dark)' },
      { name: 'theme-color', content: '#f8f5ef', media: '(prefers-color-scheme: light)' },
      { name: 'msapplication-TileColor', content: '#071a2b' },
      { name: 'msapplication-config', content: '/browserconfig.xml' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: SITE_NAME },
      { name: 'application-name', content: SITE_NAME },
      { name: 'format-detection', content: 'telephone=no' },
      { property: 'fb:app_id', content: '1234567890' },
    ],
    script: () => {
      const schemas: Record<string, any>[] = []

      if (config.jsonLd) {
        const ld = Array.isArray(config.jsonLd) ? config.jsonLd : [config.jsonLd]
        schemas.push(...ld)
      }

      // FIX 2: Narrow the scope of articlePublishedAt to a constant so TS knows it is a string
      if (unref(config.type) === 'article') {
        const pDate = unref(config.articlePublishedAt)
        if (pDate) {
          schemas.push(buildArticleSchema({
            title: unref(config.title) || 'Blog Post',
            description: unref(description),
            image: ogImage.value,
            url: canonical.value,
            publishedAt: pDate, // Now strictly string
            modifiedAt: unref(config.articleModifiedAt),
            author: unref(config.author),
            tags: unref(config.articleTags),
          }))
        }
      }

      schemas.push(buildOrganizationSchema())

      if (schemas.length === 0) return []

      return schemas.map((schema) => ({
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
      }))
    },
  })
}