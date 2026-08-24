import axios from 'axios'

const request = axios.create({
  // 打到 Cloudflare Worker Proxy，由 Worker 附加金鑰後轉發給中央氣象署開放資料平台
  // （見 worker/README.md），前端不再持有/傳送 CWA API 金鑰
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000
})

export default request
