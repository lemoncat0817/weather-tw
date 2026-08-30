/**
 * ECharts 的延遲載入器。實際的模組註冊在 `./echartsCore`，這裡只多做一件事：
 * 用 `import.meta.client` 這個**編譯期常數**把 `import()` 包起來。
 *
 * 這層守衛是必要的，不是防禦性寫法。Nuxt/Nitro 打包伺服器端時，只要模組圖裡
 * 「看得到」一個 `import('echarts/core')`，就會把整包 echarts 當成外部相依複製進
 * `.output/server/node_modules/`（實測 echarts 4.9 MB + zrender 832 KB），而這些程式碼
 * 在伺服器上一行都不會執行——它需要 Canvas，圖表容器也包在 `<ClientOnly>` 裡。
 * 對 Cloudflare Workers 而言那是白白灌大 Worker bundle、拉長冷啟動時間。
 *
 * Vite 會把 SSR bundle 裡的 `import.meta.client` 直接替換成 `false`，整個區塊變成死碼
 * 被 Rollup 移除，echarts 因此完全不會出現在伺服器的模組圖裡；瀏覽器端替換成 `true`，
 * 行為完全不受影響。
 */
type EChartsCore = (typeof import('./echartsCore'))['echarts']

let runtime: Promise<EChartsCore> | null = null

export function loadECharts(): Promise<EChartsCore> {
  if (import.meta.client) {
    runtime ??= import('./echartsCore').then((mod) => mod.echarts)
  }
  return runtime ?? Promise.reject(new Error('ECharts 只能在瀏覽器端載入'))
}
