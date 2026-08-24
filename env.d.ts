/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Cloudflare Worker（API Proxy）的網址，見 worker/README.md
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
