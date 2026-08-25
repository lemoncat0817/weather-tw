import type { GeoFeatureCollection, GeoPolygon } from '#shared/types'

// 靜態頁面 + 368 個鄉鎮預報頁（/forecast/[county]/[town]），是全站流量最大宗的長尾頁面，
// 對應計畫書選 Nuxt SSR 的理由之一（公開氣象站吃搜尋流量）。鄉鎮清單直接讀已經產生好的
// taiwan-towns.geojson（跟 /map 的 choropleth 用同一份），不用另外打 CWA API。
//
// 注意：內部用 $fetch 撈 public/ 底下的靜態檔，在 `nuxt dev` 會 404——dev 模式 Vite 和 Nitro
// 是兩個行程，Nitro 內部對 public 靜態資源的自我 fetch 不會經過 Vite 的 dev middleware。
// 已用 `pnpm build && node .output/server/index.mjs` 實測正式建置版本正確，正式環境
// public/ 會被複製進 .output/public 由 Nitro 自己的 static handler 服務，沒有這個問題。
const STATIC_PAGES = ['', '/map', '/typhoon', '/earthquake', '/observation', '/climate', '/warnings']

export default defineCachedEventHandler(
  async (event): Promise<string> => {
    const boundaries = await $fetch<GeoFeatureCollection<GeoPolygon, { county: string; town: string }>>(
      '/data/taiwan-towns.geojson'
    )
    const base = getRequestURL(event).origin

    const urls = [
      ...STATIC_PAGES.map((path) => `${base}${path}`),
      ...boundaries.features.map(
        (f) => `${base}/forecast/${encodeURIComponent(f.properties.county)}/${encodeURIComponent(f.properties.town)}`
      )
    ]

    setHeader(event, 'content-type', 'application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((url) => `  <url><loc>${url}</loc></url>`)
      .join('\n')}\n</urlset>\n`
  },
  { maxAge: 60 * 60 * 24, name: 'sitemap' }
)
