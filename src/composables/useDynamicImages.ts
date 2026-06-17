import { ref } from 'vue'
import { useCMS } from './useCMS'

/**
 * Centralized image key definitions for the entire application.
 * Keys with hyphens or spaces use quoted property names.
 */
export const IMAGE_KEYS = {
  // Home page
  home: {
    heroVideo1: 'home_hero_video_1',
    heroVideo2: 'home_hero_video_2',
    heroVideo3: 'home_hero_video_3',
    heroVideo4: 'home_hero_video_4',
    heroVideo5: 'home_hero_video_5',
    introImage1: 'home_intro_image_1',
    introImage2: 'home_intro_image_2',
    'tourOceanSafari': 'home_tour_ocean-safari',
    'tourDiveExpedition': 'home_tour_dive-expedition',
    experienceShip: 'home_experience_ship',
    experienceDining: 'home_experience_dining',
    experienceStateroom: 'home_experience_stateroom',
    ctaBackground: 'home_cta_background',
  },
  // About page
  about: {
    hero: 'about_hero',
    heroVideo: 'about_hero_video',
    australianOysters: 'about_australian_oysters',
    australianOystersSecondary: 'about_australian_oysters_secondary',
    teamAaron: 'about_team_aaron',
    teamAaronSecondary: 'about_team_aaron_secondary',
    history1: 'about_history_1',
    history2: 'about_history_2',
    history3: 'about_history_3',
    history4: 'about_history_4',
  },
  // Expeditions page
  expeditions: {
    hero: 'expeditions_hero',
    heroVideo: 'expeditions_hero_video',
    'oceanSafariHover': 'expeditions_ocean-safari_hover',
    'diveExpeditionHover': 'expeditions_dive-expedition_hover',
  },
  // Ocean Safari page
  'ocean-safari': {
    heroVideo: 'ocean-safari_hero_video',
    heroVideoPoster: 'ocean-safari_hero_video_poster',
    heroFallback: 'ocean-safari_hero_fallback',
    itineraryDay1: 'ocean-safari_itinerary_day1',
    itineraryDay2: 'ocean-safari_itinerary_day2',
    itineraryDay3: 'ocean-safari_itinerary_day3',
    itineraryDay4: 'ocean-safari_itinerary_day4',
    vesselGallery1: 'ocean-safari_vessel_gallery_1',
    vesselGallery2: 'ocean-safari_vessel_gallery_2',
    vesselGallery3: 'ocean-safari_vessel_gallery_3',
    vesselGallery4: 'ocean-safari_vessel_gallery_4',
    vesselGallery5: 'ocean-safari_vessel_gallery_5',
    vesselGallery6: 'ocean-safari_vessel_gallery_6',
    diningGallery1: 'ocean-safari_dining_gallery_1',
    diningGallery2: 'ocean-safari_dining_gallery_2',
    diningGallery3: 'ocean-safari_dining_gallery_3',
    diningGallery4: 'ocean-safari_dining_gallery_4',
    routeMapBg: 'ocean-safari_route_map_bg',
    aboutSection: 'ocean-safari_about_section',
    enquiryBg: 'ocean-safari_enquiry_bg',
  },
  // Dive Expedition page
  'dive-expedition': {
    heroVideo: 'dive-expedition_hero_video',
    heroVideoPoster: 'dive-expedition_hero_video_poster',
    heroFallback: 'dive-expedition_hero_fallback',
    itineraryDay1: 'dive-expedition_itinerary_day1',
    itineraryDay2: 'dive-expedition_itinerary_day2',
    itineraryDay3: 'dive-expedition_itinerary_day3',
    itineraryDay4: 'dive-expedition_itinerary_day4',
    itineraryDay5: 'dive-expedition_itinerary_day5',
    itineraryDay6: 'dive-expedition_itinerary_day6',
    itineraryDay7: 'dive-expedition_itinerary_day7',
    vesselGallery1: 'dive-expedition_vessel_gallery_1',
    vesselGallery2: 'dive-expedition_vessel_gallery_2',
    vesselGallery3: 'dive-expedition_vessel_gallery_3',
    vesselGallery4: 'dive-expedition_vessel_gallery_4',
    vesselGallery5: 'dive-expedition_vessel_gallery_5',
    vesselGallery6: 'dive-expedition_vessel_gallery_6',
    vesselGallery7: 'dive-expedition_vessel_gallery_7',
    vesselGallery8: 'dive-expedition_vessel_gallery_8',
    diningGallery1: 'dive-expedition_dining_gallery_1',
    diningGallery2: 'dive-expedition_dining_gallery_2',
    diningGallery3: 'dive-expedition_dining_gallery_3',
    diningGallery4: 'dive-expedition_dining_gallery_4',
    diningGallery5: 'dive-expedition_dining_gallery_5',
    diningGallery6: 'dive-expedition_dining_gallery_6',
    routeMapBg: 'dive-expedition_route_map_bg',
    aboutSection1: 'dive-expedition_about_section_1',
    aboutSection2: 'dive-expedition_about_section_2',
    aboutSection3: 'dive-expedition_about_section_3',
    aboutSection4: 'dive-expedition_about_section_4',
    enquiryBg: 'dive-expedition_enquiry_bg',
  },
  // Blog
  blog: {
    listHero: 'blog_list_hero',
    listHeroVideo: 'blog_list_hero_video',
    detailHeroFallback: 'blog_detail_hero_fallback',
  },
  // Contact
  contact: {
    hero: 'contact_hero',
    heroVideo: 'contact_hero_video',
  },
  // FAQ
  faq: {
    hero: 'faq_hero',
    heroVideo: 'faq_hero_video',
  },
} as const

export type PageImageKeys = typeof IMAGE_KEYS
export type PageKey = keyof PageImageKeys

export function useDynamicImages() {
  const cms = useCMS()
  const loading = ref(false)

  function getImage(key: string, fallbackUrl: string = ''): string {
    return cms.getImage(key, fallbackUrl)
  }

  function getAlt(key: string, fallbackAlt: string = ''): string {
    return cms.getImageAlt(key, fallbackAlt)
  }

  function getImageArray(prefix: string, fallbacks: string[]): string[] {
    return fallbacks.map((fb, i) => cms.getImage(`${prefix}_${i + 1}`, fb))
  }

  function getHeroBackground(pageKey: PageKey, type: 'image' | 'video' = 'image'): string {
    const page = IMAGE_KEYS[pageKey]
    if (!page) return ''

    if (type === 'video') {
      const videoKey = Object.entries(page).find(([k]) => k.includes('Video'))?.[1]
      return videoKey ? cms.getImage(videoKey, '') : ''
    }

    const heroKey = Object.entries(page).find(([k]) => k === 'hero')?.[1]
    return heroKey ? cms.getImage(heroKey, '') : ''
  }

  function isOverridden(key: string): boolean {
    const img = cms.getAllImages().find((i) => i.key === key)
    return !!img?.url && img.url !== img.fallbackUrl
  }

  return {
    loading,
    getImage,
    getAlt,
    getImageArray,
    getHeroBackground,
    isOverridden,
    IMAGE_KEYS,
  }
}
