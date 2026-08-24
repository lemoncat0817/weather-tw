import type {
  GeoFeature,
  GeoLineString,
  GeoPolygon,
  Typhoon,
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
