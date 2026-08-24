import { normalizeEarthquakes } from '../../utils/normalize/earthquake'
import type { Earthquake } from '#shared/types'

/** 最近的顯著有感地震報告，預設 10 筆。快取 5 分鐘。 */
export default defineCachedEventHandler(
  async (event): Promise<Earthquake[]> => {
    const limit = Number(getQuery(event).limit ?? 10)
    const raw = await fetchDataset('E-A0015-001', { limit })
    return normalizeEarthquakes(raw as never)
  },
  { maxAge: 60 * 5, name: 'earthquake-recent', getKey: cacheKeyFor }
)
