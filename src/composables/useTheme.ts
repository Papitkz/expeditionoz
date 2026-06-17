import { ref, watch, onMounted } from 'vue'

type ThemeMode = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'expedition-oz-theme'
const THEME_EVENT = 'themeChanged'

const currentTheme = ref('expeditionDark')
const themeMode = ref<ThemeMode>('dark')

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getThemeFromMode(mode: ThemeMode): string {
  if (mode === 'system') {
    return getSystemTheme() === 'dark' ? 'expeditionDark' : 'expeditionLight'
  }
  return mode === 'dark' ? 'expeditionDark' : 'expeditionLight'
}

function applyTheme(mode: ThemeMode) {
  const themeName = getThemeFromMode(mode)
  currentTheme.value = themeName
  themeMode.value = mode

  // Update document data attribute for CSS
  document.documentElement.setAttribute('data-theme', themeName === 'expeditionDark' ? 'dark' : 'light')

  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      themeName === 'expeditionDark' ? '#071a2b' : '#f8f5ef'
    )
  }

  // Update body background
  document.body.style.backgroundColor =
    themeName === 'expeditionDark' ? '#071a2b' : '#f8f5ef'
  document.body.style.color =
    themeName === 'expeditionDark' ? '#f8f5ef' : '#1a1a1a'
}

export function useTheme() {
  function setTheme(mode: ThemeMode) {
    themeMode.value = mode
    applyTheme(mode)
    localStorage.setItem(STORAGE_KEY, mode)
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { mode } }))
  }

  function toggleTheme() {
    const newMode = themeMode.value === 'dark' ? 'light' : 'dark'
    setTheme(newMode)
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved && ['dark', 'light', 'system'].includes(saved)) {
      applyTheme(saved)
    } else {
      // Default to dark (the original theme)
      applyTheme('dark')
    }

    // Listen for system theme changes
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', () => {
      if (themeMode.value === 'system') {
        applyTheme('system')
      }
    })
  }

  onMounted(() => {
    initTheme()
  })

  return {
    currentTheme,
    themeMode,
    setTheme,
    toggleTheme,
    initTheme,
  }
}

// For non-composable usage
export function getCurrentThemeMode(): ThemeMode {
  return themeMode.value
}
