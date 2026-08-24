import { normalizeCountyWarnings } from '../utils/normalize/warning'
import type { CountyWarning } from '#shared/types'

/** 各縣市目前的天氣警特報情形。快取 10 分鐘。 */
export default defineCachedEventHandler(
  async (): Promise<CountyWarning[]> => {
    const raw = await fetchDataset('W-C0033-001')
    return normalizeCountyWarnings(raw as never)
  },
  { maxAge: 60 * 10, name: 'warnings' }
)
