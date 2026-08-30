/**
 * maplibre-gl 的唯一載入點，而且刻意是「動態」的。
 *
 * 這個套件壓縮後約 1 MB（gzip 約 246 KB），而且完全只在瀏覽器有意義（要 WebGL 與 DOM）。
 * 之前它被 `app/plugins/maplibre-worker.client.ts` 在頂層靜態 import，Nuxt 的 plugin 會被
 * 打進所有路由共用的 entry chunk——實測 `/warnings`、`/climate` 這種完全沒有地圖的頁面
 * 也要下載整包，單一 entry chunk 高達 1.65 MB（480 KB gzip，裡面連 ECharts 也一起）。
 * 頁面若再用 `import { Popup } from 'maplibre-gl'`，同一包還會被打進 SSR 伺服器 bundle，
 * 徒增 Cloudflare Workers 的 bundle 體積與冷啟動時間。
 *
 * 統一改成「帶編譯期守衛的動態 import」：
 * - 只有真的掛載地圖的頁面才會下載，其餘頁面 0 KB。
 * - `import.meta.client` 是 Vite 的編譯期常數，SSR bundle 會被替換成 `false`，整個
 *   `import()` 變成死碼被 Rollup 移除。這一層不能省：只要伺服器端的模組圖裡「看得到」
 *   這個 import，Nitro 就會把整包 maplibre-gl 當成外部相依複製進
 *   `.output/server/node_modules/`（實測 1.1 MB），而它在伺服器上一行都不會執行
 *   （需要 WebGL 與 DOM）——對 Cloudflare Workers 就是白白灌大 bundle、拖長冷啟動。
 * - ESM 模組快取保證整個 app 只會真的載入一次，`Popup`／`Marker` 這類在事件處理器裡
 *   才需要的類別再 await 一次也是同步命中，沒有額外的網路往返。
 *
 * worker 網址的設定也集中在這裡（見 setWorkerUrl 的說明），確保「載入模組」與
 * 「設定 worker 網址」永遠是同一件事，不可能有人只做了其中一半。
 */
type MapLibreModule = typeof import('maplibre-gl')

let modulePromise: Promise<MapLibreModule> | null = null

/**
 * MapLibre GL 的正式生產環境黑地圖 bug（跟 Phase 2 修過的那個 dev-only worker 404 是不同問題，
 * 那個修法只影響 Vite dev server，對 build 完全沒作用）：
 *
 * MapLibre 內部算 worker 檔案網址的方式不是 Vite 認得出來、能自動打包/複製的
 * `new Worker(new URL('./x.js', import.meta.url))` 靜態寫法，而是自己包一層函式、
 * 用字串組出 `${import.meta.url 所在目錄}/maplibre-gl-worker.mjs`（見 maplibre-gl 套件原始碼
 * dist/maplibre-gl.mjs 裡的 `wi()` 函式）。這種動態組出來的路徑 Vite 在 build 階段完全看不懂，
 * 於是這個 worker 檔案永遠不會被複製進最終輸出——本機 `pnpm dev` 因為是 Vite dev server
 * 直接讀 node_modules 原始檔案，剛好沒事；但正式 `pnpm build`（不管是 node-server 還是
 * cloudflare-module preset，兩者都實測過）產出的版本裡這個檔案完全不存在，導致 worker 讀取
 * 404，vector tile 完全不會被解析，整張地圖只剩控制項、畫面全黑——這正是實際部署到 Cloudflare
 * Workers 後發生的真實 bug，用 Playwright 對正式 production build 實測抓到的，不是用猜的。
 *
 * 修法：把 node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs 複製一份到 public/
 * （Nuxt 的 public/ 內容會原封不動複製到網站根目錄、檔名不會被打包工具改動或加 hash），
 * 再用 maplibre-gl 官方公開的 setWorkerUrl() API（見它自己的 .d.ts）明確指定 worker 網址，
 * 完全繞過它自己內部那套猜不出來的動態網址邏輯。
 *
 * worker 檔案本身內部又用同一種手法動態載入另一個共用模組 maplibre-gl-shared.mjs
 * （main thread 跟 worker thread 共用的程式碼），worker 網址被我們改到 /maplibre-gl-worker.mjs
 * 之後，它會用 import.meta.url 算出 /maplibre-gl-shared.mjs 這個路徑去載入——所以這個檔案
 * 也要一起複製到 public/ 底下同一層，實測驗證過兩個檔案都要有、放對位置，地圖才會真的畫出來。
 *
 * 若之後升級 maplibre-gl 大版本，要記得重新複製 public/maplibre-gl-worker.mjs 跟
 * public/maplibre-gl-shared.mjs 這兩個檔案（目前版本鎖在 package.json 的 ^6.6.0，
 * 同一個大版本內這兩個內部檔案的存在與命名不會變）。**只複製這兩個 .mjs，不要連
 * .mjs.map 一起複製**——sourcemap 合計 2.4 MB，會原封不動被部署上 Workers 當死重量。
 */
export function loadMapLibre(): Promise<MapLibreModule> {
  if (import.meta.client) {
    modulePromise ??= import('maplibre-gl').then((mod) => {
      mod.setWorkerUrl('/maplibre-gl-worker.mjs')
      return mod
    })
  }
  return modulePromise ?? Promise.reject(new Error('maplibre-gl 只能在瀏覽器端載入'))
}
