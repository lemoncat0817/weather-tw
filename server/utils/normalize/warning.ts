import type { CountyWarning, WeatherHazard } from '#shared/types'

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
