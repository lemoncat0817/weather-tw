import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2026-08-25',

  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    // maplibre-gl 動態載入自己的 web worker（處理 vector tile 解析），Vite 的依賴預打包
    // 對這種 `new Worker(new URL(...))` 動態路徑處理不完美，實測會讓 worker 檔案 404/
    // ERR_FAILED，導致地圖 style/sprite 都正確載入卻整個畫面全黑（worker 掛了，pbf 圖磚
    // 完全沒被解析）。排除預打包即可讓 Vite 直接照原始模組路徑處理，worker 就能正常載入。
    optimizeDeps: { exclude: ['maplibre-gl'] }
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
      // OpenFreeMap 的免金鑰深色 vector style（見 https://openfreemap.org），
      // 無需註冊、無流量限制；可用 NUXT_PUBLIC_MAP_STYLE_URL 覆寫成自架的 style
      mapStyleUrl: 'https://tiles.openfreemap.org/styles/dark'
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
