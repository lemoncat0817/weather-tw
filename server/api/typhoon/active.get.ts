import { normalizeTyphoons } from '../../utils/normalize/typhoon'
import type { Typhoon } from '#shared/types'

/** 目前活動中的熱帶氣旋（可能為空陣列，代表現在沒有颱風）。快取 10 分鐘。 */
export default defineCachedEventHandler(
  async (): Promise<Typhoon[]> => {
    const raw = await fetchDataset('W-C0034-005')
    return normalizeTyphoons(raw as never)
  },
  { maxAge: 60 * 10, name: 'typhoon-active' }
)
