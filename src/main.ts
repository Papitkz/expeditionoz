import { ViteSSG } from 'vite-ssg'
import { createVuetify } from 'vuetify'
import { createHead } from '@unhead/vue'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
import App from './App.vue'
import { routes } from './router'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'expeditionDark',
    themes: {
      expeditionDark: {
        dark: true,
        colors: {
          primary: '#c9a84c',
          secondary: '#0d6e7a',
          background: '#071a2b',
          surface: '#0a2e4a',
          error: '#e07b5a',
          info: '#0d6e7a',
          success: '#4caf50',
          warning: '#c9a84c',
        },
      },
      expeditionLight: {
        dark: false,
        colors: {
          primary: '#c9a84c',
          secondary: '#0d6e7a',
          background: '#f8f5ef',
          surface: '#ffffff',
          error: '#e07b5a',
          info: '#0d6e7a',
          success: '#4caf50',
          warning: '#c9a84c',
        },
      },
    },
  },
})

export const createApp = ViteSSG(
  App,
  { routes, base: '/' },
  ({ app, router, isClient }) => {
    const head = createHead()
    app.use(head)
    app.use(router)
    app.use(vuetify)

    if (isClient && typeof window !== 'undefined') {
      const redirect = sessionStorage.getItem('spa-redirect')
      if (redirect) {
        sessionStorage.removeItem('spa-redirect')
        router.replace(redirect)
      }
    }
  },
)