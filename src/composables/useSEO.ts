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
  '/': 'Sailing expeditions through Ningaloo Reef, Western Australia. Ocean Safari Expedition (5 nights, from $5,000 AUD), Dive Expedition (8 nights, from $9,600 AUD) and Ocean Safari Escape (3 nights, from $3,000 AUD). 2027 season open.',
  '/expeditions': 'Three Ningaloo expeditions — the signature Ocean Safari Expedition (5 nights), the flagship Dive Expedition (8 nights), and the shorter Ocean Safari Escape (3 nights). All depart Exmouth, Western Australia, small groups, all-inclusive.',
  '/expeditions/ocean-safari': 'Ocean Safari Expedition: our signature 5-night Ningaloo sailing expedition aboard Sylfia. Maximum 12 guests. Whale watching, snorkelling, all-inclusive meals and gear. From $5,000 AUD. Departing Exmouth, WA. Book 2027.',
  '/expeditions/dive-expedition': 'Dive Expedition: our flagship 8-night liveaboard aboard Millennium covering the remote reaches of Ningaloo Reef. Scuba diving, seasonal whale shark and humpback encounters. From $9,600 AUD. Maximum 14 guests. 2027 departures open.',
  '/expeditions/ocean-safari-escape': 'Ocean Safari Escape: a 3-night Ningaloo sailing escape aboard Sylfia. Maximum 12 guests. Remote reefs, wildlife, beach visits and sunset anchorages. From $3,000 AUD. Departing Exmouth, WA. Book 2027.',
  '/about': 'Expedition OZ runs small-group sailing expeditions through Ningaloo Marine Park, Western Australia. Learn about our vessels, crew, and approach to reef-safe operations since 2018.',
  '/contact': 'Get in touch with Expedition OZ. Phone, email, or WhatsApp. Based in Exmouth, Western Australia. We respond within 24 hours on business days.',
  '/faq': 'Questions about Ningaloo Reef sailing expeditions answered: what to pack, how to handle seasickness, dive certifications required, payment and cancellation terms, and best departure windows.',
  '/blog': 'Field notes, species guides, and stories from Ningaloo Reef. Whale shark encounters, reef conditions, crew perspectives, and what to expect on an Expedition OZ voyage.',
  '/limited-expeditions': 'Handpicked small-group departures built around passion, purpose and extraordinary ocean experiences at Ningaloo. Private and hosted expeditions released throughout the season.',
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