import { normalizeThunderstormAndInstantAlerts } from '../../utils/normalize/thunderstorm'
import type { InstantAlertsResponse } from '#shared/types'

const WARNING_CONTENT_URL = 'https://www.cwa.gov.tw/Data/js/warn/Warning_Content.js'

/**
 * 取得中央氣象署目前發布之大雷雨即時訊息與即時天氣提醒。
 * 包含短時劇烈天氣、大雷雨警戒區與強風等即時告警。
 * 快取 3 分鐘（TTL 180s）。
 */
export default defineCachedEventHandler(
  async (): Promise<InstantAlertsResponse> => {
    try {
      const jsText = await $fetch<string>(WARNING_CONTENT_URL, {
        responseType: 'text',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10_000
      })
      return normalizeThunderstormAndInstantAlerts(jsText)
    } catch {
      return {
        updatedAt: new Date().toISOString(),
        alerts: []
      }
    }
  },
  { maxAge: 60 * 3, name: 'warnings-instant' }
)
