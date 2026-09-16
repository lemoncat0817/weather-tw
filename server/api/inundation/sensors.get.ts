import { normalizeInundationSensors } from '../../utils/normalize/inundation'
import type { InundationSummary } from '#shared/types'

// 經濟部水利署水利資料開放平台：IoW淹水深度最新資料（resource 1b991bbb-ad85-4e7a-b931-06ce8749d3ed）
const INUNDATION_RESOURCE_ID = '1b991bbb-ad85-4e7a-b931-06ce8749d3ed'

/**
 * 全臺路面淹水感測器即時監測與積淹水統計。
 * 平台免金鑰，全台涵蓋約 1,366 處路面感測設備。
 * 快取 5 分鐘（TTL 300s）。
 */
export default defineCachedEventHandler(
  async (): Promise<InundationSummary> => {
    try {
      const raw = await fetchWraDataset(INUNDATION_RESOURCE_ID, { limit: 2000 })
      return normalizeInundationSensors(raw as never)
    } catch {
      return {
        updatedAt: new Date().toISOString(),
        totalSensors: 0,
        activeInundationCount: 0,
        activeSensors: [],
        byCounty: []
      }
    }
  },
  { maxAge: 60 * 5, name: 'inundation-sensors' }
)
