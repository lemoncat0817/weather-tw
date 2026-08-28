# 氣象知多少

台灣天氣資訊平台 —— 即時預報、雷達回波、颱風路徑與地震資訊，資料全部來自中央氣象署開放資料平台（CWA Open Data）。

[![Deploy](https://github.com/lemoncat0817/weather-tw/actions/workflows/deploy.yml/badge.svg)](https://github.com/lemoncat0817/weather-tw/actions/workflows/deploy.yml)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

**線上版本：[weather-tw.jimdeng0817.workers.dev](https://weather-tw.jimdeng0817.workers.dev)**

## 功能

| 頁面 | 內容 |
|---|---|
| 首頁 | 現況總覽、24 小時 meteogram、警特報／颱風／地震快訊、7 日預報 |
| 鄉鎮預報 | 逐時溫度、體感溫度、降雨機率、風標、濕度、晝夜底紋 |
| 互動地圖 | 雷達回波動畫、全台測站觀測、368 鄉鎮溫度 choropleth，圖層可切換 |
| 颱風 | 歷史／預報路徑、70% 機率不確定性錐、強度時序 |
| 地震 | 震央地圖與各縣市震度分布 |
| 觀測 | 氣象站／雨量站地圖與可排序表格 |
| 趨勢 | 近期觀測 vs. 1991–2020 氣候平均 |
| 警特報 | 全台 22 縣市特報彙整 |

## 技術堆疊

| 層 | 選型 |
|---|---|
| 框架 | Nuxt 4（SSR）＋ TypeScript strict |
| 樣式 | Tailwind CSS v4（CSS-first `@theme` design token） |
| 圖表 | ECharts 6 |
| 地圖 | MapLibre GL JS 6 ＋ OpenFreeMap 免金鑰深色底圖 |
| 測試 | Vitest |
| 部署 | Cloudflare Workers（Nitro `cloudflare-module`）＋ KV 快取 |

## 快速開始

需要 Node.js ≥ 22 與 pnpm。

```sh
pnpm install
cp .env.example .env   # 填入 NUXT_CWA_API_KEY，於 https://opendata.cwa.gov.tw 免費申請
pnpm dev               # http://localhost:3000
```

### 指令

| 指令 | 說明 |
|---|---|
| `pnpm dev` | 開發伺服器 |
| `pnpm build` / `pnpm preview` | 正式建置／本機預覽 |
| `pnpm typecheck` | 型別檢查 |
| `pnpm lint` | ESLint（自動修正） |
| `pnpm test` | Vitest |
| `pnpm deploy:cloudflare` | 建置並部署到 Cloudflare Workers |

## 架構

```
app/      前端：pages、components、utils
server/   Nitro API 與 CWA 資料正規化
shared/   前後端共用型別
```

三個核心設計：

1. **金鑰只在伺服器端** —— CWA 金鑰由 `useRuntimeConfig()` 在請求當下讀取，不會進入前端 bundle 或 API 回應。
2. **反腐層（anti-corruption layer）** —— CWA 各資料集的欄位命名、巢狀結構、大小寫慣例互不一致；`server/utils/normalize/**` 統一轉成 `shared/types` 的領域模型，前端完全不接觸原始 JSON。
3. **依資料時效分層快取** —— 每支 API 以 `defineCachedEventHandler` 設定各自的 TTL，在 Workers 上由 KV 承載。

<details>
<summary>API 端點</summary>

| 端點 | 內容 | TTL |
|---|---|---|
| `GET /api/forecast/thirty-six-hour` | 全台 22 縣市今明 36 小時預報 | 30 分 |
| `GET /api/forecast/{county}/{town}` | 鄉鎮 3 天逐時 ＋ 1 週延伸預報 | 30 分 |
| `GET /api/forecast/choropleth` | 368 鄉鎮溫度分布 | 30 分 |
| `GET /api/observation/stations?type=weather\|auto\|rain` | 測站觀測 GeoJSON | 10 分 |
| `GET /api/radar/frames` | 雷達回波動畫影格（伺服器端滾動視窗） | 5 分 |
| `GET /api/typhoon/active` | 作用中颱風路徑與強度 | 10 分 |
| `GET /api/earthquake/recent?limit=10` | 近期顯著有感地震與震度分布 | 5 分 |
| `GET /api/warnings` | 22 縣市警特報 | 10 分 |
| `GET /api/climate/{stationId}` | 近期觀測 vs. 氣候常態 | 6 小時 |

</details>

## 部署

推送到 `master` 會觸發 GitHub Actions：`typecheck` → `lint` → `test` 全數通過才建置並部署到 Cloudflare Workers。

首次設定、本機手動部署、回滾與密鑰輪替的完整步驟見 **[DEPLOY.md](DEPLOY.md)**。

## 資料來源

- 氣象資料：[中央氣象署開放資料平台](https://opendata.cwa.gov.tw/)
- 鄉鎮界線：內政部鄉鎮市區界線，政府資料開放授權條款（詳見 [public/data/README.md](public/data/README.md)）
- 地圖底圖：[OpenFreeMap](https://openfreemap.org)，基於 OpenStreetMap 資料
