import type {
  GeoFeature,
  GeoLineString,
  GeoPolygon,
  Typhoon,
  TyphoonAdvisory,
  TyphoonFixPoint,
  TyphoonForecastPoint,
  TyphoonQuadrantRadii
} from '#shared/types'
import { circlePoints, convexHull } from '../geo'

interface CwaQuadrantRadii {
  Radius: Array<{ value: string; dir: string }>
}
interface CwaCircle {
  Radius?: string
  QuadrantRadii?: CwaQuadrantRadii
}
interface CwaAnalysisFix {
  DateTime: string
  CoordinateLongitude: string
  CoordinateLatitude: string
  MaxWindSpeed?: string
  MaxGustSpeed?: string
  Pressure?: string
  MovingSpeed?: string
  MovingDirection?: string
  Circle15ms?: CwaCircle
}
interface CwaForecastFix {
  InitialTime: string
  ForecastHour: string
  CoordinateLongitude: string
  CoordinateLatitude: string
  MaxWindSpeed?: string
  MaxGustSpeed?: string
  Pressure?: string
  MovingSpeed?: string
  MovingDirection?: string
  Circle15ms?: CwaCircle
  Radius70PercentProbability?: string
}
interface CwaTropicalCyclone {
  Year: string | number
  TyphoonName: string
  CwaTyphoonName: string
  CwaTyNo: string | number
  CwaTdNo: string | number
  AnalysisData?: { Fix: CwaAnalysisFix[] }
  ForecastData?: { Fix: CwaForecastFix[] }
}
interface CwaTyphoonResponse {
  records: {
    TropicalCyclones: { TropicalCyclone: CwaTropicalCyclone[] }
  }
}

function num(v: string | undefined): number | null {
  if (v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function quadrantRadii(circle: CwaCircle | undefined): TyphoonQuadrantRadii | null {
  const q = circle?.QuadrantRadii?.Radius
  if (!q || q.length === 0) return null
  const find = (dir: string) => num(q.find((r) => r.dir === dir)?.value)
  return { ne: find('NE'), se: find('SE'), sw: find('SW'), nw: find('NW') }
}

function sharedFixFields(fix: CwaAnalysisFix | CwaForecastFix): Omit<TyphoonFixPoint, 'time'> {
  return {
    position: { lat: num(fix.CoordinateLatitude) ?? 0, lon: num(fix.CoordinateLongitude) ?? 0 },
    maxWindSpeed: num(fix.MaxWindSpeed),
    maxGustSpeed: num(fix.MaxGustSpeed),
    pressure: num(fix.Pressure),
    movingSpeed: num(fix.MovingSpeed),
    movingDirection: fix.MovingDirection ?? null,
    radius15ms: num(fix.Circle15ms?.Radius),
    radius25ms: null,
    quadrantRadii15ms: quadrantRadii(fix.Circle15ms)
  }
}

function toFixPoint(fix: CwaAnalysisFix): TyphoonFixPoint {
  return { time: fix.DateTime, ...sharedFixFields(fix) }
}

/** 預報點沒有直接給「有效時間」，只有發布時間 + 預報時數，這裡算出實際的未來時間點 */
function toForecastPoint(fix: CwaForecastFix): TyphoonForecastPoint {
  const forecastHour = num(fix.ForecastHour) ?? 0
  const validTime = new Date(fix.InitialTime)
  validTime.setHours(validTime.getHours() + forecastHour)

  return {
    time: validTime.toISOString(),
    ...sharedFixFields(fix),
    forecastHour,
    probabilityRadius70: num(fix.Radius70PercentProbability)
  }
}

function toLine<K extends 'track' | 'forecast'>(points: TyphoonFixPoint[], kind: K): GeoFeature<GeoLineString, { kind: K }> {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: points.map((p) => [p.position.lon, p.position.lat]) },
    properties: { kind }
  }
}

/**
 * 由每個預報點的 70% 機率半徑畫一圈近似圓，取所有圓上的點的凸包，
 * 當作簡化版的不確定性錐（做法與多數氣象網站一致：外包絡近似，非嚴謹的機率密度計算）。
 */
function toProbabilityCone(forecast: TyphoonForecastPoint[]): GeoFeature<GeoPolygon, { kind: 'probabilityCone' }> | null {
  const cloud: Array<[number, number]> = []
  for (const p of forecast) {
    if (p.probabilityRadius70 === null) continue
    cloud.push(...circlePoints(p.position, p.probabilityRadius70))
  }
  if (cloud.length < 3) return null
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [convexHull(cloud)] },
    properties: { kind: 'probabilityCone' }
  }
}

function normalizeOne(tc: CwaTropicalCyclone): Typhoon {
  const track = (tc.AnalysisData?.Fix ?? []).map(toFixPoint)
  const forecast = (tc.ForecastData?.Fix ?? []).map(toForecastPoint)
  return {
    id: `${tc.Year}-${tc.CwaTyNo}`,
    year: Number(tc.Year),
    name: tc.TyphoonName,
    nameZh: tc.CwaTyphoonName,
    track,
    forecast,
    trackLine: toLine(track, 'track'),
    forecastLine: toLine(forecast, 'forecast'),
    probabilityCone: toProbabilityCone(forecast)
  }
}

export function normalizeTyphoons(raw: CwaTyphoonResponse): Typhoon[] {
  return (raw.records.TropicalCyclones.TropicalCyclone ?? []).map(normalizeOne)
}

// ---------------------------------------------------------------------------
// W-C0034-001：颱風警報公告本身（報數、海上/陸上類別、CWA 原文章節），跟上面的路徑幾何互補
// ---------------------------------------------------------------------------

interface CwaFreeTextSection {
  title: string
  value: string
}
/** typhoon-info.section 陣列裡混雜著純文字條目（title+value）跟一個特殊條目（"颱風資訊"，
 *  沒有 value，改用 typhoon_name/cwa_typhoon_name 等額外欄位），用 optional 欄位涵蓋兩種形狀 */
interface CwaTyphoonInfoEntry {
  title: string
  value?: string
  typhoon_name?: string
  cwa_typhoon_name?: string
}
interface CwaCapAdvisoryInfo {
  headline: string
  severity?: string
  effective: string
  expires: string
  description?: {
    section?: CwaFreeTextSection[]
    'typhoon-info'?: Array<{ section: CwaTyphoonInfoEntry[] }>
  }
}
interface CwaTyphoonAdvisoryResponse {
  records: { info?: CwaCapAdvisoryInfo[] }
}

/** CWA 在沒有現行警報時仍會回傳最後一次發布的舊資料（跟 W-C0033-003/004/005 同一套機制），
 *  用 expires 是否已過去判斷是否還算現行，過期一律濾掉。`now` 參數只為了讓測試能固定時間點。 */
export function normalizeTyphoonAdvisories(raw: CwaTyphoonAdvisoryResponse, now: Date = new Date()): TyphoonAdvisory[] {
  return (raw.records.info ?? [])
    .filter((info) => new Date(info.expires).getTime() > now.getTime())
    .map((info) => {
      const entries = info.description?.['typhoon-info']?.[0]?.section ?? []
      const byTitle = new Map(entries.map((e) => [e.title, e]))
      const typhoonInfo = byTitle.get('颱風資訊')

      return {
        headline: info.headline,
        category: byTitle.get('警報類別')?.value ?? '',
        bulletinNumber: byTitle.get('警報報數')?.value ?? '',
        typhoonNo: byTitle.get('颱風編號')?.value ?? '',
        typhoonName: typhoonInfo?.typhoon_name ?? '',
        typhoonNameZh: typhoonInfo?.cwa_typhoon_name ?? '',
        severity: (info.severity as TyphoonAdvisory['severity']) ?? 'Minor',
        effective: info.effective,
        expires: info.expires,
        sections: info.description?.section ?? []
      }
    })
}
