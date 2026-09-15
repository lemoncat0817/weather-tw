import { twd97Tm2ToWgs84 } from '../twd97'
import type { RiverAlertLevel, RiverStation } from '#shared/types'

// ---------------------------------------------------------------------------
// 即時水位資料 ＋ 河川水位測站站況，經濟部水利署水利資料開放平台（免金鑰）
// ---------------------------------------------------------------------------
//
// 節錄自實際回應（2026-09-15 實測）。

interface WraRiverLiveRecord {
  stationid: string
  datetime: string
  waterlevel: string
  checkresult: string
}
export type WraRiverLiveResponse = WraRiverLiveRecord[]

interface WraRiverStationRecord {
  observatoryidentifier: string
  observatoryname: string
  rivername: string
  locationbytwd97_xy: string
  alertlevel1: string
  alertlevel2: string
  alertlevel3: string
}
export type WraRiverStationResponse = WraRiverStationRecord[]

interface RiverStationMeta {
  name: string
  river: string
  coordinates: { lat: number; lon: number }
  alertLevel1: number | null
  alertLevel2: number | null
  alertLevel3: number | null
}

function parseWraNumber(v: string | undefined): number | null {
  if (v === undefined || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** datetime 是 naive 的 "YYYY-MM-DDTHH:MM:SS"（已經是 ISO 格式但沒帶時區），實際是
 *  台北時間，補上 +08:00 才不會在 UTC 容器部署後全部位移 8 小時。 */
function toTaipeiIso(naive: string): string {
  return `${naive}+08:00`
}

/**
 * 站況資料的 observatoryidentifier 是帶流域前綴的長碼（如 "3132020RV1010H006"），
 * 即時水位的 stationid 是後段的測站編號本身（如 "1010H006"，實測全數 8 碼）——
 * 兩邊格式不一致，用後 8 碼當 join key。這裡回傳「測站編號 → 中繼資料」的查表，
 * 供 normalizeRiverStations 使用；查不到座標的測站（locationbytwd97_xy 缺值或格式跑掉）
 * 直接不收進表裡，join 階段自然會把對應的即時讀值濾掉。
 */
export function normalizeRiverStationMeta(raw: WraRiverStationResponse): Record<string, RiverStationMeta> {
  const result: Record<string, RiverStationMeta> = {}
  for (const r of raw) {
    const coords = twd97Tm2ToWgs84(r.locationbytwd97_xy)
    if (!coords) continue
    const code = r.observatoryidentifier.slice(-8)
    result[code] = {
      name: r.observatoryname,
      river: r.rivername,
      coordinates: coords,
      alertLevel1: parseWraNumber(r.alertlevel1),
      alertLevel2: parseWraNumber(r.alertlevel2),
      alertLevel3: parseWraNumber(r.alertlevel3)
    }
  }
  return result
}

/** 三級警戒門檻由低到高（level3 最先觸發），依序比對；三個門檻都沒公告時視為
 *  'unavailable'，不是 'normal'——「沒有門檻資料」跟「有門檻、目前正常」是兩回事。 */
function classifyAlert(waterLevel: number | null, meta: RiverStationMeta): RiverAlertLevel {
  const { alertLevel1, alertLevel2, alertLevel3 } = meta
  if (alertLevel1 === null && alertLevel2 === null && alertLevel3 === null) return 'unavailable'
  if (waterLevel === null) return 'unavailable'
  if (alertLevel1 !== null && waterLevel >= alertLevel1) return 'level1'
  if (alertLevel2 !== null && waterLevel >= alertLevel2) return 'level2'
  if (alertLevel3 !== null && waterLevel >= alertLevel3) return 'level3'
  return 'normal'
}

/**
 * 即時水位跟站況 join。實測發現約 1% 的讀值 `checkresult` 是 "false"（例如「高於堤頂高」
 * 「近期水位變化超過 3.5m」這類上游自己標註的異常），這種讀值不可信，一律當成沒有讀值
 * （null），不會被誤判成正在發生的警戒——顯示一個看起來嚴重但其實是感測器異常的數字，
 * 比顯示「無資料」更容易誤導人。
 */
export function normalizeRiverStations(
  raw: WraRiverLiveResponse,
  metaByCode: Record<string, RiverStationMeta>
): RiverStation[] {
  const result: RiverStation[] = []
  for (const r of raw) {
    const meta = metaByCode[r.stationid]
    if (!meta) continue

    const waterLevel = r.checkresult === 'true' ? parseWraNumber(r.waterlevel) : null

    result.push({
      id: r.stationid,
      name: meta.name,
      river: meta.river,
      coordinates: meta.coordinates,
      observationTime: toTaipeiIso(r.datetime),
      waterLevel,
      alertLevel: classifyAlert(waterLevel, meta),
      alertThresholds: { level1: meta.alertLevel1, level2: meta.alertLevel2, level3: meta.alertLevel3 }
    })
  }
  return result
}
