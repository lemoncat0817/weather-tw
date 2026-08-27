# 部署

本站部署在 Cloudflare Workers，Worker 名稱 `weather-tw`，正式網址
<https://weather-tw.jimdeng0817.workers.dev>。

推送到 `master` 會由 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 自動部署，
`typecheck` → `lint` → `test` 三道關卡全綠才會建置上線。

| 項目 | 值 |
|---|---|
| Nitro preset | `cloudflare-module`（由 `NITRO_PRESET` 環境變數啟用，非寫死） |
| 快取後端 | Cloudflare KV，binding 名稱 `CACHE` |
| 執行期密鑰 | `NUXT_CWA_API_KEY`（Worker secret，非建置期變數） |
| 建置輸出 | `.output/`，Nitro 於此產生實際部署用的 `server/wrangler.json` |

---

## 前置需求

- Node.js ≥ 22、pnpm（見 `package.json` 的 `engines` / `packageManager`）
- Cloudflare 帳號（免費方案即可）
- CWA Open Data 金鑰，於 <https://opendata.cwa.gov.tw> 免費申請

---

## 首次設定

只需做一次。已完成設定的環境請直接跳到「[日常部署](#日常部署)」。

### 1. 登入 Cloudflare

```sh
pnpm exec wrangler login
pnpm exec wrangler whoami    # 記下輸出中的 Account ID，步驟 3 會用到
```

### 2. 建立 KV namespace

`defineCachedEventHandler` 預設使用檔案系統快取，但 Workers 沒有持久化檔案系統，因此改用 KV。

```sh
pnpm exec wrangler kv namespace create CACHE
```

把輸出的 `id` 填入 [`wrangler.jsonc`](wrangler.jsonc) 的 `kv_namespaces[0].id` 並提交。

> 未設定 KV 時 Nitro 會退回行程內記憶體快取——服務仍可運作，但每個 edge 節點各自快取，命中率下降。
> 這是效果打折，不是故障。

### 3. 設定 GitHub Actions Secrets

Repo → Settings → Secrets and variables → Actions：

| Secret | 取得方式 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens → Create Token，套用「Edit Cloudflare Workers」範本 |
| `CLOUDFLARE_ACCOUNT_ID` | 步驟 1 的 `wrangler whoami` 輸出，或 Dashboard 右側欄 |
| `NUXT_CWA_API_KEY` | CWA Open Data 金鑰 |

### 4. 設定 Worker 執行期密鑰

CI 會在每次部署時同步這個 secret，但若要從本機手動部署，需先自行設定一次：

```sh
pnpm exec wrangler secret put NUXT_CWA_API_KEY --cwd .output
```

---

## 日常部署

### 透過 CI（預設路徑）

推送到 `master` 即可。也可在 GitHub Actions 頁面手動觸發（workflow 有設 `workflow_dispatch`），
此時部署的是所選分支當下的內容。

### 從本機手動部署

```sh
pnpm build:cloudflare     # NITRO_PRESET=cloudflare-module nuxt build
pnpm deploy:cloudflare    # 上一行 + wrangler deploy --cwd .output
```

> **`--cwd .output` 是必要的。** Nitro 實際產生的 `wrangler.json` 在 `.output/server/`，但 wrangler
> 必須從上一層 `.output/` 執行才能正確解析部署重新導向設定；直接指向 `.output/server/` 會因為
> wrangler 無法對應 `.wrangler/deploy/config.json` 與 `wrangler.json` 的關係而失敗。
> `package.json` 的 script 已包含此參數，但 script 以外的指令（如 `wrangler secret put`）需自行加上。

繞過 CI 代表也繞過 `typecheck`／`lint`／`test`。手動部署前請自行跑過。

---

## 驗證

```sh
pnpm exec wrangler deployments status --cwd .output   # 目前線上版本
pnpm exec wrangler deployments list --cwd .output     # 最近 10 次部署
```

接著開啟正式網址，確認首頁與 `/map`、`/typhoon` 至少各一頁能正常載入資料。
`/map` 需特別確認地圖有實際繪出底圖與圖磚（見下方疑難排解的「地圖全黑」）。

---

## 回滾

```sh
pnpm exec wrangler versions list --cwd .output                       # 找出要回到的 version id
pnpm exec wrangler rollback <version-id> --cwd .output -m "回滾原因"
```

程式碼層面的回滾則是 `git revert` 後推送到 `master`，讓 CI 重新走完整關卡——
若問題出在建置產物而非設定，這才是能留下記錄的正確做法。

---

## 密鑰輪替

1. 於 <https://opendata.cwa.gov.tw> 會員中心產生新金鑰
2. 更新 GitHub Secret `NUXT_CWA_API_KEY`
3. `pnpm exec wrangler secret put NUXT_CWA_API_KEY --cwd .output`
4. 重新部署，確認站台仍能取得資料後，於 CWA 後台停用舊金鑰

金鑰僅由 [`server/utils/cwa.ts`](server/utils/cwa.ts) 透過 `useRuntimeConfig()` 在請求當下讀取，
不會進入前端 bundle，也不會出現在任何 API 回應內容中。因此建置階段不需要真實金鑰——
CI 刻意傳入佔位字串，真正的金鑰是另外推送給 Worker 執行期的。

---

## 疑難排解

| 症狀 | 原因 | 處理 |
|---|---|---|
| 頁面顯示「伺服器尚未設定 CWA_API_KEY」 | Worker 執行期 secret 未設定或名稱錯誤 | 重跑首次設定步驟 4；確認名稱是 `NUXT_CWA_API_KEY` |
| 地圖全黑，只剩控制項 | MapLibre worker 未被打包 | 確認 `public/maplibre-gl-worker.mjs` 與 `public/maplibre-gl-shared.mjs` 存在；升級 maplibre-gl 大版本後需從 `node_modules/maplibre-gl/dist/` 重新複製 |
| wrangler 找不到設定檔 | 未加 `--cwd .output` | 見「從本機手動部署」的說明 |
| 快取似乎沒生效 | KV namespace 未建立或 id 未填 | 見首次設定步驟 2 |
| 不同縣市查到相同預報 | 快取鍵碰撞 | API handler 需傳 `getKey: cacheKeyFor`，見 [`server/utils/cacheKey.ts`](server/utils/cacheKey.ts) |

---

## 設計決策

**為什麼是 Cloudflare Workers**——免費額度沒有閒置休眠，這對一個仰賴搜尋流量的公開站台是關鍵：
休眠中的伺服器會讓爬蟲與訪客的第一個請求極慢，等於抵銷掉選用 SSR 而非 SPA 的理由。
其次是邊緣節點離台灣近、Nitro 有第一方 `cloudflare-module` 支援，不需額外轉接層。

**為什麼不把 `nitro.preset` 寫死**——本機開發與 `pnpm build` 走的是預設的 node-server preset，
Cloudflare 專屬設定（KV 快取、`nodeCompat`、`deployConfig`）只在偵測到 `NITRO_PRESET=cloudflare*`
時才加入。兩種建置路徑互不干擾，本機驗證的行為不會因為部署設定而改變。詳見
[`nuxt.config.ts`](nuxt.config.ts)。

**根目錄的 `wrangler.jsonc` 不會被直接部署**——Nitro 在建置時讀取它，與自己產生的設定合併後寫入
`.output/server/wrangler.json`，那才是 `wrangler deploy` 實際使用的檔案。根目錄這份只提供 Nitro
推導不出來的設定（Worker 名稱與 KV binding），**不放任何密鑰**。
