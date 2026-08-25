import { COUNTY_DATASETS } from '../../utils/countyDatasets'
import { normalizeTownSummaries } from '../../utils/normalize/forecast'
import type { TownSummary } from '#shared/types'

/**
 * 全台 368 鄉鎮的預報摘要（choropleth 用）。CWA 的 F-D0047-093 不帶 LocationName 時
 * 會回傳整個縣市的所有鄉鎮，所以 22 縣市各打一次就能涵蓋全台，不需要 368 次個別請求。
 * 快取 30 分鐘，跟其他預報路由一致。
 */
export default defineCachedEventHandler(
  async (): Promise<TownSummary[]> => {
    const entries = Object.entries(COUNTY_DATASETS)
    const results = await Promise.all(
      entries.map(async ([county, ids]) => {
        const raw = await fetchDataset(ids.threeDay, { locationId: ids.threeDay })
        return normalizeTownSummaries(raw as never, county)
      })
    )
    return results.flat()
  },
  { maxAge: 60 * 30, name: 'forecast-choropleth' }
)
