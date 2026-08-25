# 氣象知多少

台灣天氣資訊平台，深色專業儀表板風格，資料全部來自中央氣象署開放資料平台（CWA Open Data），
經伺服器端正規化後提供給前端使用。

## 技術架構

| 層 | 選型 |
|---|---|
| 框架 | Nuxt 4（`app/` 前端、`server/` Nitro 後端、`shared/` 前後端共用型別） |
| 樣式 | Tailwind CSS v4（`@tailwindcss/vite`，CSS-first `@theme` design token） |
| 圖表 | ECharts 6（直接管理，未用 vue-echarts wrapper） |
| 地圖 | MapLibre GL JS 6（OpenFreeMap 免金鑰深色底圖） |
| 測試 | Vitest |
| 資料來源 | 中央氣象署開放資料平台（CWA Open Data API） |

CWA 原始 API 回應結構混亂、不同資料集之間欄位命名/巢狀結構/大小寫慣例都不一致，
`server/utils/normalize/**` 是一層反腐層（anti-corruption layer），把這些原始結構轉成
`shared/types` 定義的乾淨領域模型，前端（`app/`）完全不需要碰觸 CWA 的原始 JSON 形狀。

## 功能

- 首頁：現況總覽、今明 24 小時 meteogram、警特報／颱風／地震快訊、7 日預報條
- 鄉鎮逐時預報：完整 meteogram（溫度、體感溫度、降雨機率、風標、濕度、晝夜底紋）
- 互動地圖：雷達回波疊圖、全台測站觀測點、368 鄉鎮溫度分布 choropleth，圖層可切換
- 颱風路徑：歷史／預報路徑、70% 機率不確定性錐、強度時序
- 地震資訊：震央地圖、各縣市震度分布
- 觀測資料：氣象站／雨量站地圖與可排序表格
- 歷史趨勢：近期觀測 vs. 1991–2020 氣候平均值比較
- 警特報：全台 22 縣市特報彙整

## 開發

需要 Node.js 與 pnpm，並在 `.env` 設定 `NUXT_CWA_API_KEY`（見
[中央氣象署開放資料平台](https://opendata.cwa.gov.tw/) 申請金鑰）。

```sh
pnpm install
pnpm dev          # 開發模式
pnpm build        # 正式建置
pnpm typecheck    # 型別檢查
pnpm lint         # ESLint
pnpm test         # Vitest
```

