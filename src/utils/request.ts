import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  // 打到 Cloudflare Worker Proxy，由 Worker 附加金鑰後轉發給中央氣象署開放資料平台
  // （見 worker/README.md），前端不再持有/傳送 CWA API 金鑰
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000
})

// 統一錯誤處理：原本 9 支 API 呼叫都沒有 catch，請求失敗時畫面只會卡在
// loading 或空白，這裡集中攔截並跳出提示，讓使用者至少知道發生了什麼事
request.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response
      ? `氣象資料取得失敗（${error.response.status}）`
      : error.code === 'ECONNABORTED'
        ? '氣象資料取得逾時，請稍後再試'
        : '無法連線至氣象資料伺服器，請確認網路連線'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request
