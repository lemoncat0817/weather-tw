import type { Earthquake, EarthquakeShakingArea } from '#shared/types'

interface CwaEqStation {
  StationName: string
  SeismicIntensity?: string
}
interface CwaShakingArea {
  AreaDesc: string
  CountyName: string
  AreaIntensity: string
  EqStation?: CwaEqStation[]
}
interface CwaEarthquakeRecord {
  EarthquakeNo: number
  ReportContent: string
  ReportColor: string
  ShakemapImageURI?: string
  EarthquakeInfo: {
    OriginTime: string
    FocalDepth: number
    Epicenter: {
      Location: string
      EpicenterLatitude: number
      EpicenterLongitude: number
    }
    EarthquakeMagnitude: {
      MagnitudeType: string
      MagnitudeValue: number
    }
  }
  Intensity: {
    ShakingArea: CwaShakingArea[]
  }
}
interface CwaEarthquakeResponse {
  records: { Earthquake: CwaEarthquakeRecord[] }
}

// 中央氣象署 2020 年後採用的震度分級順序，數字級距混雜「5弱/5強」這類非純數字標籤，
// 不能直接用字串/數字比較，要用查表排序
const INTENSITY_ORDER = ['0級', '1級', '2級', '3級', '4級', '5弱', '5強', '6弱', '6強', '7級']

function intensityRank(label: string): number {
  const i = INTENSITY_ORDER.indexOf(label)
  return i === -1 ? -1 : i
}

function maxIntensityOf(areas: CwaShakingArea[]): string {
  let max = ''
  let maxRank = -1
  for (const area of areas) {
    const rank = intensityRank(area.AreaIntensity)
    if (rank > maxRank) {
      maxRank = rank
      max = area.AreaIntensity
    }
  }
  return max
}

function normalizeOne(eq: CwaEarthquakeRecord): Earthquake {
  const areas: EarthquakeShakingArea[] = (eq.Intensity.ShakingArea ?? []).map((a) => ({
    county: a.CountyName,
    areaDescription: a.AreaDesc,
    intensity: a.AreaIntensity
  }))

  return {
    id: String(eq.EarthquakeNo),
    originTime: eq.EarthquakeInfo.OriginTime,
    reportContent: eq.ReportContent,
    reportColor: eq.ReportColor,
    magnitude: eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue,
    magnitudeType: eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeType,
    depthKm: eq.EarthquakeInfo.FocalDepth,
    epicenter: {
      lat: eq.EarthquakeInfo.Epicenter.EpicenterLatitude,
      lon: eq.EarthquakeInfo.Epicenter.EpicenterLongitude
    },
    epicenterDescription: eq.EarthquakeInfo.Epicenter.Location,
    maxIntensity: maxIntensityOf(eq.Intensity.ShakingArea ?? []),
    shakingAreas: areas,
    shakemapImageUrl: eq.ShakemapImageURI ?? null
  }
}

export function normalizeEarthquakes(raw: CwaEarthquakeResponse): Earthquake[] {
  return (raw.records.Earthquake ?? []).map(normalizeOne)
}
