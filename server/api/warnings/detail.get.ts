import { normalizeCapAdvisories, normalizeWarningBulletins } from '../../utils/normalize/warning'
import type { WarningDetail } from '#shared/types'

/**
 * 補充 /api/warnings 的縣市矩陣看不到的兩個角度：
 * - bulletins（W-C0033-002）：目前所有作用中特報的完整原文與影響區域清單，不限現象種類。
 * - advisories（W-C0033-003/004/005）：豪雨／低溫／高溫三種現象各自的官方 CAP 嚴重度
 *   （severity/urgency/certainty）。這三個資料集在沒有現行特報時仍會回傳最後一次發布的
 *   舊資料，過期的已在 normalizeCapAdvisories 裡濾掉，這裡拿到的只會是真的現行有效的。
 * 快取 10 分鐘，跟 /api/warnings 一致。
 */
export default defineCachedEventHandler(
  async (): Promise<WarningDetail> => {
    const [bulletinsRaw, rainfallRaw, coldRaw, heatRaw] = await Promise.all([
      fetchDataset('W-C0033-002'),
      fetchDataset('W-C0033-003'),
      fetchDataset('W-C0033-004'),
      fetchDataset('W-C0033-005')
    ])

    return {
      bulletins: normalizeWarningBulletins(bulletinsRaw as never),
      advisories: [
        ...normalizeCapAdvisories(rainfallRaw as never),
        ...normalizeCapAdvisories(coldRaw as never),
        ...normalizeCapAdvisories(heatRaw as never)
      ]
    }
  },
  { maxAge: 60 * 10, name: 'warnings-detail' }
)
