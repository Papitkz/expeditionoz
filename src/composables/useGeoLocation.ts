import { ref, onMounted } from 'vue'

export interface GeoLocationData {
  ip: string
  country: string
  countryCode: string
  countryFlag: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
}

const geoData = ref<GeoLocationData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Country code to flag emoji mapping for common countries
const FLAG_MAP: Record<string, string> = {
  AU: '🇦🇺', US: '🇺🇸', GB: '🇬🇧', PH: '🇵🇭', JP: '🇯🇵',
  CN: '🇨🇳', IN: '🇮🇳', SG: '🇸🇬', NZ: '🇳🇿', CA: '🇨🇦',
  DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸', NL: '🇳🇱',
  BR: '🇧🇷', MX: '🇲🇽', KR: '🇰🇷', TH: '🇹🇭', ID: '🇮🇩',
  MY: '🇲🇾', VN: '🇻🇳', ZA: '🇿🇦', AE: '🇦🇪', SA: '🇸🇦',
}

function getFlagEmoji(countryCode: string): string {
  return FLAG_MAP[countryCode] || '🌐'
}

export async function fetchGeoLocation(): Promise<GeoLocationData | null> {
  if (geoData.value) return geoData.value

  loading.value = true
  error.value = null

  try {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) throw new Error('Failed to fetch location')

    const data = await response.json()

    const locationData: GeoLocationData = {
      ip: data.ip || '',
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      countryFlag: getFlagEmoji(data.country_code || ''),
      region: data.region || '',
      city: data.city || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || '',
      isp: data.org || data.isp || '',
    }

    geoData.value = locationData
    loading.value = false
    return locationData
  } catch (err) {
    error.value = (err as Error).message
    loading.value = false

    // Try fallback API
    try {
      const fallback = await fetch('https://ipinfo.io/json')
      if (!fallback.ok) return null

      const data = await fallback.json()
      const loc = (data.loc || '0,0').split(',')

      const locationData: GeoLocationData = {
        ip: data.ip || '',
        country: data.country || 'Unknown',
        countryCode: data.country || '',
        countryFlag: getFlagEmoji(data.country || ''),
        region: data.region || '',
        city: data.city || '',
        latitude: parseFloat(loc[0]) || 0,
        longitude: parseFloat(loc[1]) || 0,
        timezone: data.timezone || '',
        isp: data.org || '',
      }

      geoData.value = locationData
      return locationData
    } catch {
      return null
    }
  }
}

export function useGeoLocation() {
  onMounted(() => {
    if (!geoData.value) {
      fetchGeoLocation()
    }
  })

  return {
    geoData,
    loading,
    error,
    fetchGeoLocation,
    getFlagEmoji,
  }
}
