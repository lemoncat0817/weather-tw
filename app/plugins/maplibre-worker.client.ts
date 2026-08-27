import { setWorkerUrl } from 'maplibre-gl'

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
 * 同一個大版本內這兩個內部檔案的存在與命名不會變）。
 */
export default defineNuxtPlugin(() => {
  setWorkerUrl('/maplibre-gl-worker.mjs')
})
