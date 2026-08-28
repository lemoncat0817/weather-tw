import type { CapAdvisory, CountyWarning, WarningBulletin, WeatherHazard } from '#shared/types'

interface CwaHazardInfo {
  phenomena: string
  significance: string
}
interface CwaHazard {
  info: CwaHazardInfo
  validTime?: { startTime?: string; endTime?: string }
}
interface CwaWarningLocation {
  locationName: string
  hazardConditions?: { hazards?: CwaHazard[] }
}
interface CwaWarningResponse {
  records: { location: CwaWarningLocation[] }
}

/**
 * W-C0033-001 的 startTime/endTime 是「YYYY-MM-DD HH:MM:SS」，不像其他 CWA 資料集
 * 那樣自己帶 +08:00 時區位移。用 new Date() 直接解析這種沒有時區資訊的字串，JS 引擎會
 * 用「執行環境的本地時區」當作這個字串的時區——這台機器剛好是 Asia/Taipei 所以本地測試
 * 看起來沒事，但部署到別的時區（例如 UTC 的容器）就會整批警特報時間全部偏移。
 * CWA 這裡的字串本來就是台灣時間，這裡把它轉成明確帶 +08:00 的 ISO 字串，
 * 之後不管誰用 new Date() 解析都拿到同一個瞬間，不看執行環境臉色。
 */
function toIsoWithTaipeiOffset(naive: string | undefined): string | null {
  if (!naive) return null
  return `${naive.replace(' ', 'T')}+08:00`
}

export function normalizeCountyWarnings(raw: CwaWarningResponse): CountyWarning[] {
  return raw.records.location.map((loc) => {
    const hazards: WeatherHazard[] = (loc.hazardConditions?.hazards ?? []).map((h) => ({
      phenomena: h.info.phenomena,
      significance: h.info.significance,
      startTime: toIsoWithTaipeiOffset(h.validTime?.startTime),
      endTime: toIsoWithTaipeiOffset(h.validTime?.endTime)
    }))
    return { county: loc.locationName, hazards }
  })
}

// ---------------------------------------------------------------------------
// W-C0033-002：各別天氣警特報之內容及所影響之區域（目前所有作用中特報公告的全文）
// ---------------------------------------------------------------------------

interface CwaBulletinHazardInfo {
  phenomena: string
  significance: string
  affectedAreas?: { location?: Array<{ locationName: string }> }
}
interface CwaBulletinRecord {
  datasetInfo: {
    datasetDescription: string
    validTime?: { startTime?: string; endTime?: string }
    issueTime?: string
  }
  contents?: { content?: { contentText?: string } }
  hazardConditions?: { hazards?: { hazard?: Array<{ info: CwaBulletinHazardInfo }> } }
}
interface CwaBulletinResponse {
  records: { record?: CwaBulletinRecord[] }
}

export function normalizeWarningBulletins(raw: CwaBulletinResponse): WarningBulletin[] {
  return (raw.records.record ?? []).map((r) => ({
    title: r.datasetInfo.datasetDescription,
    issueTime: toIsoWithTaipeiOffset(r.datasetInfo.issueTime) ?? '',
    startTime: toIsoWithTaipeiOffset(r.datasetInfo.validTime?.startTime),
    endTime: toIsoWithTaipeiOffset(r.datasetInfo.validTime?.endTime),
    contentText: (r.contents?.content?.contentText ?? '').trim(),
    hazards: (r.hazardConditions?.hazards?.hazard ?? []).map((h) => ({
      phenomena: h.info.phenomena,
      significance: h.info.significance,
      affectedAreas: (h.info.affectedAreas?.location ?? []).map((l) => l.locationName)
    }))
  }))
}

// ---------------------------------------------------------------------------
// W-C0033-003/004/005：CAP 格式的豪雨／低溫／高溫特報（各自單一現象，含官方 severity/urgency/certainty）
// ---------------------------------------------------------------------------

interface CwaCapInfo {
  event: string
  headline: string
  severity?: string
  urgency?: string
  certainty?: string
  effective: string
  expires: string
  description: string
  instruction?: string
}
interface CwaCapResponse {
  records: { info?: CwaCapInfo[] }
}

/**
 * CWA 在沒有現行特報時仍會回傳最後一次發布的舊資料，不會自動清空——實測 W-C0033-004
 * （低溫特報）在盛夏 8 月仍回傳當年 3 月的舊資料。這裡用 expires 是否已過去判斷是否還算
 * 「現行」，過期的一律濾掉，不會出現在回傳結果裡。`now` 參數只為了讓測試能固定時間點。
 */
export function normalizeCapAdvisories(raw: CwaCapResponse, now: Date = new Date()): CapAdvisory[] {
  return (raw.records.info ?? [])
    .filter((info) => new Date(info.expires).getTime() > now.getTime())
    .map((info) => ({
      event: info.event,
      headline: info.headline,
      severity: (info.severity as CapAdvisory['severity']) ?? 'Minor',
      urgency: (info.urgency as CapAdvisory['urgency']) ?? 'Unknown',
      certainty: (info.certainty as CapAdvisory['certainty']) ?? 'Unknown',
      effective: info.effective,
      expires: info.expires,
      description: info.description.trim(),
      instruction: info.instruction?.trim() ?? null
    }))
}
