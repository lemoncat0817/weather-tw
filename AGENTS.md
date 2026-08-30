# AGENTS.md

Guidance for AI coding agents working in this repository. Claude Code reaches this file through the
`@AGENTS.md` import in `CLAUDE.md`; other agents read it directly.

## Project

「氣象知多少」— a Taiwan weather dashboard (Nuxt 4 SSR) that reads everything from the CWA
(中央氣象署) Open Data platform and serves it from Cloudflare Workers. UI text, docs, and code
comments are Traditional Chinese; commit messages are English Conventional Commits.

## Commands

```sh
pnpm dev                  # dev server on :3000 (node-server preset)
pnpm build && pnpm preview
pnpm typecheck            # vue-tsc; NOT run by the dev server (typescript.typeCheck is false)
pnpm lint                 # eslint --fix
pnpm test                 # vitest run
pnpm format               # prettier over app/ server/ shared/
```

Run a single test file, or filter by test name:

```sh
pnpm test server/utils/normalize/__tests__/warning.test.ts
pnpm test -t 彙總列
```

`typecheck` and `lint` both depend on generated files in `.nuxt/` (`tsconfig.json` extends
`.nuxt/tsconfig.json`; `eslint.config.js` imports `.nuxt/eslint.config.mjs`). `pnpm install` runs
`nuxt prepare` via postinstall — if either command fails with a missing-module error, run
`pnpm exec nuxt prepare` first.

CI (`.github/workflows/deploy.yml`, on push to `master`) gates deploy behind
`typecheck` → `lint` → `test`, all three green. Match that order locally before committing.

Deploy: `pnpm deploy:cloudflare` (= `NITRO_PRESET=cloudflare-module nuxt build`, then
`wrangler deploy --cwd .output`). `--cwd .output` is required — Nitro writes the real
`wrangler.json` into `.output/server/`, but wrangler must run one level up to resolve the redirect
config. The same applies to one-off commands that aren't wrapped in a script, e.g.
`pnpm exec wrangler secret put NUXT_CWA_API_KEY --cwd .output`.

`DEPLOY.md` is the full runbook — first-time setup, rollback, key rotation, and a
symptom/cause/fix troubleshooting table. Consult it before changing anything deployment-related,
and keep it in sync when you do.

## Architecture

Three tiers, and the boundary between them is the main design rule:

- `app/` — pages, components, client-side utils. Talks only to `/api/**`, never to CWA.
- `server/` — Nitro API handlers plus the CWA anti-corruption layer.
- `shared/types/index.ts` — the domain model, imported from both sides as `#shared/types`.

**CWA raw shapes never leave `server/utils/normalize/`.** The CWA datasets disagree with each other
on field naming, casing, nesting, and timezone handling; every handler is a thin shell that calls
`fetchDataset`/`fetchFileApiDataset`, hands the raw payload (cast `as never`) to a normalizer, and
returns a `shared/types` value. Adding an endpoint means: type in `shared/types`, normalizer in
`server/utils/normalize/`, cached handler in `server/api/`.

**Imports.** Top-level `server/utils/*.ts` are Nitro auto-imports — `fetchDataset`,
`fetchFileApiDataset`, `cacheKeyFor`, `COUNTY_DATASETS` are used without an import statement. The
nested `server/utils/normalize/*` modules are imported explicitly by relative path. In `app/`, utils
are always imported explicitly (`@/utils/...`) even though Nuxt would auto-import them.

**Caching.** Every API handler is a `defineCachedEventHandler` with a TTL matched to how fast that
dataset actually moves (radar 5 min, observation 10 min, forecast 30 min, climate 6 h).

> Any handler whose response varies by route param or query **must** pass `getKey: cacheKeyFor`.
> Nitro's default key sanitizer strips Chinese characters (and `%XX` sequences) out of the path,
> which collapsed `/api/forecast/臺北市/中正區` and `/api/forecast/高雄市/前鎮區` onto the same
> cache key — users got another county's forecast. `cacheKeyFor` (sha1 of `event.path`) sidesteps
> it. Note `getKey` also runs *before* route params are injected, so `getRouterParam` is unusable
> there.

`useStorage('cache')` is the filesystem locally and Cloudflare KV in production (bound in
`nuxt.config.ts` only when the Cloudflare preset is active). `server/api/radar/frames.get.ts` uses
that storage as real state, not just cache: CWA only exposes the single latest radar image, so the
handler accumulates a 6-frame rolling window server-side to make the animation possible.

**Cache at the granularity the *upstream data* has, not the granularity the route happens to have.**
Sunrise/sunset (`A-B0062-001`) is one row per county per day, but it used to be fetched inside the
per-town forecast handler, whose cache key is the full path — so 368 towns each re-asked CWA for an
identical answer, up to ~17,664 requests/day against a key that has a quota. It now goes through
`sunTimesFor()` in `server/utils/sunTimes.ts`, a `defineCachedFunction` keyed by county + date: 22
requests/day. Reach for `defineCachedFunction` whenever several routes need the same upstream slice.
Do **not** pass a custom `getKey` there — Nitro runs it through `escapeKey`
(`String(key).replace(/\W/g, '')`) and JS `\w` is ASCII-only, so Chinese county names collapse to the
empty string, the same trap `cacheKeyFor` exists for. The default `hash(args)` is already safe.

**KV reads are not free, and existence checks are the trap.** unstorage's `cloudflare-kv-binding`
driver implements both `getItemRaw` *and* `hasItem` as `KV.get(key)` — checking whether a 384 KB
radar PNG exists costs a full 384 KB read. So `persistRadarImage` no longer checks; its two callers
already know the answer. Likewise `/api/radar/image?t=...` derives the storage key straight from the
timestamp hash instead of reading `frames.json` first, halving KV reads on the hot path.

**Worker responses are not edge-cached by Cloudflare.** Only a Worker's own outbound `fetch`
subrequests are. `Cache-Control` on a handler response therefore only reaches the browser, and every
new visitor still costs a Worker invocation plus a KV read. The two image proxies put their bytes in
`caches.default` through `server/utils/edgeCache.ts` (a no-op off Cloudflare, and every call is
wrapped so a cache failure can only cost speed, never correctness). They only cache when the bytes
actually match the `?t=` in the URL — otherwise a stale timestamp would get an `immutable` response
pinned to it.

**Timezones.** CWA is inconsistent — some datasets carry `+08:00`, some emit naive
`YYYY-MM-DD HH:MM:SS` that is really Taipei time. Normalizers must emit an explicit offset
(`server/utils/normalize/warning.ts` shows the pattern); parsing naive strings works on a Taipei
machine and silently shifts every timestamp once deployed to a UTC container.

**Per-county dataset IDs.** The 鄉鎮 forecast API (F-D0047) needs a *per-county dataset id* as the
`locationId` param, not a town name. `server/utils/countyDatasets.ts` holds the verified 22-county
table (odd id = 3-day hourly, even id = 1-week extended).

## Secrets and config

`NUXT_CWA_API_KEY` → `runtimeConfig.cwaApiKey`, read at request time inside `server/utils/cwa.ts`
and nowhere else. It never reaches the client bundle or an API response body. Builds do not need a
real key (CI passes a placeholder); the key is a Worker runtime secret set via `wrangler secret put`.

`nuxt.config.ts` deliberately does not hardcode `nitro.preset`. Local dev/build use the default
node-server preset; the Cloudflare-specific block (KV cache storage, `nodeCompat`, `deployConfig`)
is applied only when `NITRO_PRESET` starts with `cloudflare`. Keep that conditional intact when
touching Nitro config so local builds stay unaffected. Root `wrangler.jsonc` is not deployed
directly — Nitro merges it into `.output/server/wrangler.json` at build time; it holds only the KV
binding and worker name, never secrets.

## Frontend specifics

**maplibre-gl and ECharts are loaded through guarded dynamic imports — never import either
package directly.** Use `loadMapLibre()` from `app/utils/maplibre.ts` and `loadECharts()` from
`app/utils/echarts.ts`; `import type` is fine anywhere because type imports are erased. Both loaders
wrap their `import()` in `if (import.meta.client)`, which Vite folds to `false` in the SSR build so
Rollup drops the whole branch. That guard is load-bearing twice over:

- A static import from a Nuxt *plugin* lands in the entry chunk every route downloads. Both used to
  be plugins, which is why one 1.65 MB chunk (480 KB gzip) was served to `/warnings` and `/climate`,
  pages with neither a map nor a chart. Initial JS per page is now ~85–95 KB gzip everywhere.
- A static import anywhere reachable from SSR puts the package in the Worker bundle, where neither
  can ever run (WebGL/Canvas). Removing them took the deployed Worker from 548 KB to 287 KB gzip.

`setWorkerUrl('/maplibre-gl-worker.mjs')` lives inside `loadMapLibre()` so loading the module and
configuring its worker URL can never come apart. That URL is required: MapLibre builds its worker
path by string concatenation, which Vite cannot see, so the file is never emitted by a production
build and the map renders completely black (controls visible, no tiles). The other two parts of that
fix stay as they are — `public/maplibre-gl-worker.mjs` and `public/maplibre-gl-shared.mjs` copied
from `node_modules/maplibre-gl/dist/`, and `vite.optimizeDeps.exclude: ['maplibre-gl']` for dev.
**Re-copy both files when bumping maplibre-gl to a new major — the two `.mjs` files only, never the
`.mjs.map` sourcemaps (2.4 MB of dead weight that ships to Workers).**

**ECharts** is registered module-by-module in `app/utils/echartsCore.ts` (the chunk `loadECharts()`
pulls in). Its `app-dark` theme hardcodes hex values that duplicate the CSS tokens in
`app/assets/css/main.css`; ECharts cannot read CSS variables, so changing a token means changing
both places. `app/components/charts/BaseChart.vue` intentionally avoids `vue-echarts` and
initializes off a `watch` on the template ref rather than `onMounted`, because the ref lives inside
`<ClientOnly>` and is still null when `onMounted` fires. Don't "simplify" either back.

**Styling** is Tailwind v4 with CSS-first `@theme` tokens in `app/assets/css/main.css`. The site is
dark-only by product decision, not an unfinished light mode. Chart data colors live separately in
`app/utils/colorScales.ts`; the `CATEGORICAL` array's order is part of its color-vision-deficiency
safety guarantee — never reorder or cycle it. Those are a different semantic space from the
`--color-severity-*` tokens, which mirror CWA's official warning levels.

Pages fetch with `useFetch<T>` against `/api/**`, typed by `#shared/types`. When the URL depends on
reactive state, pass a getter for both the URL and `key` (see `app/pages/index.vue`).

**Data that only feeds a MapLibre layer must not be SSR'd.** Everything `useFetch` resolves on the
server is serialized into `__NUXT_DATA__` and re-parsed during hydration — worth it for content the
server actually renders (the `/observation` table is real SEO text and stays SSR'd), pure waste for
anything the map consumes after hydration. `/health` was shipping 600 KB of payload to render an
empty map container, and `/map` 262 KB of station readings to draw dots; both use `server: false`
now and their HTML dropped to ~88 KB. Two things to get right when you do this: add a `watch` so the
layer is drawn when the data lands (the map is usually ready first), and never branch the template
on `status` — it is `'idle'` on the server and `'pending'` during hydration, which is a guaranteed
mismatch. Branch on the data ref being null instead, as `app/pages/health/index.vue` does.

**Radar playback swaps decoded bitmaps, not URLs.** The CWA composite is a 3600×3600 PNG: 384 KB on
the wire, 49.4 MB decoded. `ImageSource.updateImage({ url })` re-fetches *and re-decodes* on every
call, and the browser HTTP cache stores the compressed PNG, so the decode cost recurs every single
700 ms tick. `app/utils/radarBitmap.ts` decodes each frame once via
`createImageBitmap(blob, { resizeWidth: 1400, resizeHeight: 1400 })` and playback feeds
`updateImage({ image })`, which the API documents as displaying an already-decoded image with no
network request. Verified in a real browser: two full playback loops, six decode calls total.
Decoding is deliberately deferred until the user first touches the timeline, and the initial frame
still goes through `{ url }` so it can reuse the `<link rel="preload">` fetch. Call `dispose()` on
unmount — `ImageBitmap`s are not garbage collected on their own.

## Tests

Only the normalizers are unit-tested, and each test pins a specific real-world CWA quirk using a
trimmed fixture captured from an actual response (e.g. earthquake `ShakingArea` mixing per-county
detail rows with aggregate rows that must be filtered out). Follow that shape: real payload excerpt,
one behavior per test, assertions that don't depend on the runner's local timezone.

`vitest.config.ts` uses `@nuxt/test-utils` with jsdom and only picks up
`{app,server,shared}/**/__tests__/**/*.test.ts`.

## Notes

- `src/` contains only empty leftover directories from the deleted Vue 3 SPA; ignore it.
- `app/pages/dev/preview.vue` is an unlinked internal page for eyeballing shared visual components.
