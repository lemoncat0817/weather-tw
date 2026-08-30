import tailwindcss from '@tailwindcss/vite'

// 部署目標是 Cloudflare Workers（見 DEPLOY.md），但這裡故意不把 nitro.preset 寫死成
// 'cloudflare-module'——本機這一整個開發階段用的都是預設的 node-server preset（`pnpm dev`／
// `pnpm build` 全部驗證過的是這個），部署時用 `NITRO_PRESET=cloudflare-module` 環境變數
// 覆寫即可，兩邊都不用改設定檔。以下這些 Cloudflare 專屬設定只在偵測到那個環境變數時才加進去，
// 確保本機/CI 平常在跑的 node-server 建置流程完全不受影響。
const isCloudflare = process.env.NITRO_PRESET?.startsWith('cloudflare') ?? false

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

  // Nitro 對 public/ 底下的檔案預設只送 ETag、不送 Cache-Control，等於每一次載入都要多一趟
  // 條件式請求才知道「沒變」。這幾個檔案的內容只會在改版時才動，而且都不小：
  // maplibre 的 worker + shared 合計 500 KB（每個有地圖的頁面都要載）、鄉鎮邊界 402 KB
  // （/health 每次進頁都抓、/map 開鄉鎮圖層時也抓）。明確給快取時間可以省掉這些往返。
  // 檔名沒有內容雜湊（public/ 的檔案不會被加 hash），所以不用 immutable；用
  // stale-while-revalidate 讓改版後仍能在背景更新，使用者不會卡在等新檔案。
  // 相對的，/_nuxt/** 的檔名本來就帶內容雜湊，Nuxt 預設已經給了 max-age=31536000, immutable，
  // 不需要在這裡重複設定（實測確認過）。
  routeRules: {
    '/data/**': { headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    '/maplibre-gl-worker.mjs': { headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    '/maplibre-gl-shared.mjs': { headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    '/Weather.svg': { headers: { 'cache-control': 'public, max-age=604800' } }
  },

  app: {
    // 克制的頁面切換效果（純淡入淡出，不做位移/縮放），且 main.css 的 prefers-reduced-motion
    // 規則對所有 transition-duration 都強制歸零，這裡不用另外判斷
    pageTransition: { name: 'page', mode: 'out-in' },
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

  nitro: isCloudflare
    ? {
        cloudflare: {
          deployConfig: true, // 讓 nitro 在 build 時把 wrangler.jsonc 寫進 .output（跟根目錄的 wrangler.jsonc 合併，見 DEPLOY.md）
          nodeCompat: true // server/utils/cwa.ts 等程式碼用到的 Node API（如 node:crypto）需要這個相容層
        },
        // defineCachedEventHandler 預設用檔案系統快取，Cloudflare Workers 沒有持久化檔案系統，
        // 改綁到 KV（wrangler.jsonc 裡的 CACHE binding，namespace 要照 DEPLOY.md 的步驟先建立）。
        // 沒設定的話 nitro 會退回一個行程內的記憶體快取，一樣能動、只是每個 edge 節點各自快取，
        // 命中率較低——不是壞掉，只是效果打折扣。
        storage: {
          cache: { driver: 'cloudflare-kv-binding', binding: 'CACHE' }
        }
      }
    : {},

  eslint: {
    config: {
      stylistic: false // 交給 prettier 處理格式
    }
  }
})
