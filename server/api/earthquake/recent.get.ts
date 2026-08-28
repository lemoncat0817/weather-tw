import { normalizeEarthquakes } from '../../utils/normalize/earthquake'
import type { Earthquake } from '#shared/types'

type EarthquakeScope = 'significant' | 'all'
function isScope(v: unknown): v is EarthquakeScope {
  return v === 'significant' || v === 'all'
}

/**
 * 最近的地震報告。預設只有「顯著有感」（E-A0015-001，上新聞等級）；`type=all` 額外併入
 * 「小區域有感」（E-A0016-001，規模較小但仍有感），依 EarthquakeNo 去重、依時間排序——
 * 兩個資料集理論上互斥（CWA 依顯著度分流），但沒有書面保證絕不重疊，防禦性去重比較保險。
 * 快取 5 分鐘。
 */
export default defineCachedEventHandler(
  async (event): Promise<Earthquake[]> => {
    const query = getQuery(event)
    const limit = Number(query.limit ?? 10)
    const scope: EarthquakeScope = isScope(query.type) ? query.type : 'significant'

    const significantRaw = await fetchDataset('E-A0015-001', { limit })
    const significant = normalizeEarthquakes(significantRaw as never)
    if (scope === 'significant') return significant

    const smallAreaRaw = await fetchDataset('E-A0016-001', { limit })
    const smallArea = normalizeEarthquakes(smallAreaRaw as never)

    const byId = new Map<string, Earthquake>()
    for (const eq of [...significant, ...smallArea]) byId.set(eq.id, eq)

    return [...byId.values()].sort((a, b) => b.originTime.localeCompare(a.originTime)).slice(0, limit)
  },
  { maxAge: 60 * 5, name: 'earthquake-recent', getKey: cacheKeyFor }
)
