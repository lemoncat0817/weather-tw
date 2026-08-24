# vue3-weather-proxy

Cloudflare Worker，代理前端對[中央氣象署開放資料平台](https://opendata.cwa.gov.tw)的請求，讓 API 金鑰不再出現在前端程式碼裡。

## 部署步驟（需要 Cloudflare 帳號）

```sh
cd worker
pnpm install        # 或 npm install

# 登入 Cloudflare（第一次使用需要，會開瀏覽器做 OAuth 授權）
npx wrangler login

# 設定金鑰（會提示輸入，不會寫進任何檔案或 git）
# 請先到 https://opendata.cwa.gov.tw 註冊/更新一組新的 API 金鑰再貼上
npx wrangler secret put CWA_API_KEY

# 部署
pnpm run deploy
```

部署完成後，終端機會印出 Worker 網址，形如：

```
https://vue3-weather-proxy.<你的 subdomain>.workers.dev
```

把這個網址填進專案根目錄的 `.env.production`（`VITE_API_BASE_URL`），然後重新 `pnpm build` 部署前端。

## 本機開發

```sh
cd worker
pnpm run dev
```

預設會在 `http://127.0.0.1:8787` 啟動本機 Worker（`wrangler dev` 支援用 `.dev.vars` 檔案在本機提供 `CWA_API_KEY`，內容為 `CWA_API_KEY=你的金鑰`，該檔案已被根目錄 `.gitignore` 的 `*.local` 規則排除在外時記得改用 `.dev.vars` 專屬命名，wrangler 預設會忽略此檔案不進版控）。專案根目錄的 `.env.development` 預設就是指向這個本機位址，`pnpm dev` 時前端會打到本機 Worker。

## 修改允許的前端來源

`src/index.ts` 裡的 `ALLOWED_ORIGINS` 目前包含 GitHub Pages 的預設網域與本機開發網址。如果之後前端搬家（自訂網域、換成 Vercel 等），記得同步更新這個陣列。
