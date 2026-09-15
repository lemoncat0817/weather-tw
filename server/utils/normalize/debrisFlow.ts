import type { DebrisFlowAlert, DebrisFlowAlertLevel, DebrisFlowAlertType } from '#shared/types'

// ---------------------------------------------------------------------------
// 土石流／大規模崩塌警戒：即時清單 ＋ 發布歷史紀錄，農業部農村發展及水土保持署
// ---------------------------------------------------------------------------
//
// 歷史紀錄節錄自實際回應（2026-09 實測，這個平台不需要金鑰）。即時清單目前（平時無警戒）
// 回傳空陣列，欄位形狀取自官方資料集欄位字典（data.gov.tw 資料集 7284）——這份字典跟
// 歷史紀錄資料集（同一個機關維護、欄位幾乎一樣）不同的地方只有 County/Town 兩個欄位改成
// 小寫開頭 county/town，其餘欄位大小寫、拼法完全一致，可信度足夠直接採用；但畢竟沒有
// 實際跑出資料驗證過，如果哪天真的遇到警戒、資料對不上，第一個該檢查的就是這裡的大小寫。

interface ArdswcHistoryRecord {
  AlertType: string
  DebrisNo: string
  LandslideID: string
  LandslideName: string
  County: string
  Town: string
  Vill: string
  AlertLevel: string
  LastUpdateDate: string
  ReportID: string
}
export type ArdswcHistoryResponse = ArdswcHistoryRecord[]

interface ArdswcLiveRecord {
  AlertType: string
  DebrisNo: string
  LandslideID: string
  LandslideName: string
  county: string
  town: string
  Vill: string
  AlertLevel: string
  LastUpdateDate: string
  ReportID: string
}
export type ArdswcLiveResponse = ArdswcLiveRecord[]

const ALERT_TYPE: Record<string, DebrisFlowAlertType> = { D: 'debris', L: 'landslide' }
const ALERT_LEVEL: Record<string, DebrisFlowAlertLevel> = { y: 'yellow', r: 'red' }

// 上游用 "-" 表示「這個類型不適用的欄位」（土石流警戒的 LandslideID/LandslideName、
// 大規模崩塌的 DebrisNo、部分崩塌區沒有細分村里的 Vill），一律轉成 null
function orNull(v: string | undefined): string | null {
  return v && v !== '-' ? v : null
}

/** LastUpdateDate 是 naive 的 "YYYY-MM-DD HH:MM"（沒有秒數），實際是台北時間，
 *  補上 :00+08:00 才不會在 UTC 容器部署後全部位移 8 小時。 */
function toTaipeiIso(naive: string): string {
  return `${naive.replace(' ', 'T')}:00+08:00`
}

interface RawFields {
  AlertType: string
  DebrisNo: string
  LandslideID: string
  LandslideName: string
  Vill: string
  AlertLevel: string
  LastUpdateDate: string
  ReportID: string
}

function toAlert(county: string, town: string, r: RawFields): DebrisFlowAlert {
  const isLandslide = r.AlertType === 'L'
  return {
    id: isLandslide ? r.LandslideID : r.DebrisNo,
    type: ALERT_TYPE[r.AlertType] ?? 'debris',
    name: isLandslide ? r.LandslideName : r.DebrisNo,
    county,
    town,
    village: orNull(r.Vill),
    level: ALERT_LEVEL[r.AlertLevel] ?? 'yellow',
    updateTime: toTaipeiIso(r.LastUpdateDate),
    reportId: r.ReportID
  }
}

/** 歷史紀錄實測沒有分頁或排序參數，伺服器端固定上限 9999 筆——依 updateTime 明確重新
 *  排序（新到舊），不假設上游回傳順序已經排好。 */
export function normalizeDebrisFlowHistory(raw: ArdswcHistoryResponse): DebrisFlowAlert[] {
  return raw.map((r) => toAlert(r.County, r.Town, r)).sort((a, b) => b.updateTime.localeCompare(a.updateTime))
}

export function normalizeDebrisFlowLiveAlerts(raw: ArdswcLiveResponse): DebrisFlowAlert[] {
  return raw.map((r) => toAlert(r.county, r.town, r)).sort((a, b) => b.updateTime.localeCompare(a.updateTime))
}
