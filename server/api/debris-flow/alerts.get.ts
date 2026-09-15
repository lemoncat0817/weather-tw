import { normalizeDebrisFlowHistory, normalizeDebrisFlowLiveAlerts } from '../../utils/normalize/debrisFlow'
import type { DebrisFlowSummary } from '#shared/types'

/**
 * 目前現行警戒（active）＋近期發布紀錄（recent，取最新 20 筆）。
 * 即時清單平時是空陣列，本身就是答案，快取跟地震一樣給 5 分鐘；歷史紀錄伺服器端固定
 * 回傳全部 9999 筆（沒有分頁/篩選參數可用，見 server/utils/ardswc.ts 的說明），內容本身
 * 變動不快（只有新警戒發布時才變），給 30 分鐘，避免每次都重抓一份幾 MB 的回應。
 * 兩支上游更新頻率不同，用同一個 handler 的同一個 TTL 是取兩者中較短的那個，不是最理想
 * （歷史紀錄那支其實可以快取更久），但這支端點呼叫量本來就低，先求正確、不做過早最佳化。
 */
export default defineCachedEventHandler(
  async (): Promise<DebrisFlowSummary> => {
    const [liveRaw, historyRaw] = await Promise.all([fetchDebrisFlowLiveAlerts(), fetchDebrisFlowHistory()])
    return {
      active: normalizeDebrisFlowLiveAlerts(liveRaw as never),
      recent: normalizeDebrisFlowHistory(historyRaw as never).slice(0, 20)
    }
  },
  { maxAge: 60 * 5, name: 'debris-flow-alerts' }
)
