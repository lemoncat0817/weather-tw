import { normalizeTsunamiReports } from '../../utils/normalize/tsunami'
import type { TsunamiReport } from '#shared/types'

/**
 * 最近的海嘯資訊發布。跟地震不同，海嘯事件極罕見、不需要分「顯著/全部」範圍，
 * 快取 30 分鐘（跟警特報同等級）——真的有海嘯事件時 CWA 約每 15-45 分鐘更新一次，
 * 平常則長期沒有新資料，30 分鐘不會讓使用者等太久才看到最新一報。
 */
export default defineCachedEventHandler(
  async (event): Promise<TsunamiReport[]> => {
    const limit = Number(getQuery(event).limit ?? 10)
    const raw = await fetchDataset('E-A0014-001', { limit })
    return normalizeTsunamiReports(raw as never)
  },
  { maxAge: 60 * 30, name: 'tsunami-recent' }
)
