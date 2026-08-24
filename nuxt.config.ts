import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2026-08-25',

  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@pinia/nuxt', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()]
  },

  app: {
    head: {
      title: '氣象知多少',
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '台灣即時天氣預報、雷達回波、颱風路徑與地震資訊的專業氣象資訊平台。'
        },
        { name: 'theme-color', content: '#0b1220' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/Weather.svg' }]
    }
  },

  // 氣象資料只在伺服器端向 CWA 抓取，前端只吃 server/api/** 正規化過的乾淨格式
  runtimeConfig: {
    cwaApiKey: '',
    public: {
      mapStyleUrl: ''
    }
  },

  typescript: {
    strict: true,
    typeCheck: false // 用 `pnpm typecheck` 手動跑，避免拖慢 dev server
  },

  eslint: {
    config: {
      stylistic: false // 交給 prettier 處理格式
    }
  }
})
