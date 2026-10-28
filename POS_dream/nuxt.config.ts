export default defineNuxtConfig({
  // POS screens run as a client-side app: they rely on browser-only APIs
  // (IndexedDB via Dexie, Socket.IO) and are not indexed by search engines.
  ssr: false,

  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'vuetify-nuxt-module'
  ],

  app: {
    head: {
      title: 'POS Dream',
      htmlAttrs: { lang: 'th' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }]
    }
  },

  vuetify: {
    vuetifyOptions: {
      icons: {
        defaultSet: 'mdi'
      },

      theme: {
        defaultTheme: 'posTheme',
        themes: {
          posTheme: {
            dark: false,
            colors: {
              primary: '#2563EB',
              secondary: '#475569',
              success: '#16A34A',
              warning: '#F59E0B',
              error: '#DC2626',
              background: '#F8FAFC',
              surface: '#FFFFFF'
            }
          }
        }
      }
    }
  },

  // Overridden at runtime by NUXT_PUBLIC_API_BASE / NUXT_PUBLIC_SOCKET_URL.
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:4000',
      socketUrl: 'http://localhost:4000'
    }
  }
})
