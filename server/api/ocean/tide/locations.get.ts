import { normalizeTideLocations } from '../../../utils/normalize/ocean'
import type { TideLocation } from '#shared/types'

/**
 * 潮汐預報涵蓋的地點清單（266 個，含行政區、漁港、海水浴場、潛點等，不只是鄉鎮），供選單使用。
 * 帶 Date 篩選只拿當天那一筆，把回應從「266 地點 × 32 天」壓到「266 地點 × 1 天」——
 * 只是要地點清單，不需要每個地點的完整月預報。地點清單本身幾乎不變，快取 24 小時。
 */
export default defineCachedEventHandler(
  async (): Promise<TideLocation[]> => {
    const raw = await fetchDataset('F-A0021-001', { Date: todayInTaipei() })
    return normalizeTideLocations(raw as never)
  },
  { maxAge: 60 * 60 * 24, name: 'tide-locations' }
)
