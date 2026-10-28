export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'vuetify-nuxt-module'
  ],

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

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL
    }
  }
})