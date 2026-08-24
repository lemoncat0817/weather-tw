import { normalizeThirtySixHour } from '../../utils/normalize/forecast'
import type { ThirtySixHourForecast } from '#shared/types'

/** 今明 36 小時預報，全部 22 縣市。快取 30 分鐘。 */
export default defineCachedEventHandler(
  async (): Promise<ThirtySixHourForecast[]> => {
    const raw = await fetchDataset('F-C0032-001')
    return normalizeThirtySixHour(raw as never)
  },
  { maxAge: 60 * 30, name: 'forecast-36h' }
)
