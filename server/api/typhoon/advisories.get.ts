import { normalizeTyphoonAdvisories } from '../../utils/normalize/typhoon'
import type { TyphoonAdvisory } from '#shared/types'

/**
 * 颱風警報公告本身（報數、海上/陸上類別、CWA 原文章節），補足 /api/typhoon/active（W-C0034-005）
 * 只有路徑幾何、沒有警報文字內容的空缺。可能為空陣列（代表現在沒有現行警報，過期的舊資料
 * 已在 normalizeTyphoonAdvisories 濾掉）。快取 10 分鐘，跟 active 一致。
 */
export default defineCachedEventHandler(
  async (): Promise<TyphoonAdvisory[]> => {
    const raw = await fetchDataset('W-C0034-001')
    return normalizeTyphoonAdvisories(raw as never)
  },
  { maxAge: 60 * 10, name: 'typhoon-advisories' }
)
