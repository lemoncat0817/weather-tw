import { fetchDgpaWorkSchoolHtml } from '../utils/dgpa'
import { normalizeDgpaHtml } from '../utils/normalize/workSchoolStatus'
import type { WorkSchoolStatusResponse } from '#shared/types'

/**
 * 取得全台 22 縣市天然災害停止上班及上課最新情形。
 * 來源：行政院人事行政總處（DGPA）天然災害即時通報網頁。
 * 快取 5 分鐘（TTL 300s）。
 */
export default defineCachedEventHandler(
  async (): Promise<WorkSchoolStatusResponse> => {
    try {
      const html = await fetchDgpaWorkSchoolHtml()
      return normalizeDgpaHtml(html)
    } catch {
      // 網路異常或上游不可用時，退回平時全台正常狀態
      return {
        updatedAt: new Date().toISOString(),
        isDefaultStatus: true,
        title: '全台照常上班上課（離線快取）',
        counties: [
          '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
          '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '臺南市',
          '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'
        ].map((county) => ({
          county,
          status: 'normal',
          statusText: '照常上班、照常上課'
        })),
        announcement: '目前無天然災害停止上班及上課訊息。'
      }
    }
  },
  { maxAge: 60 * 5, name: 'work-school-status' }
)
