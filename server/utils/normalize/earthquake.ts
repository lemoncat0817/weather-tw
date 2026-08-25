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

/**
 * CWA 的 Intensity.ShakingArea 陣列混雜兩種列：真正「每個縣市一筆」的明細列（AreaDesc 固定是
 * 「{縣市}地區」），以及 CWA 自己算好、每個震度等級一筆的「彙總列」（AreaDesc 固定是
 * 「最大震度X級地區」，CountyName 則是該震度等級所有縣市的清單）。兩種列的 AreaIntensity 是一樣的，
 * 若不濾掉彙總列，同一個縣市就會重複出現。
 * 一開始想用「CountyName 是否含頓號」判斷彙總列，但若某震度等級剛好只有一個縣市，
 * 彙總列的 CountyName 就只會是那一個縣市名、不含頓號，跟明細列完全無法區分（已用單元測試鎖住
 * 這個邊界案例）。AreaDesc 開頭是否為「最大震度」才是兩種列真正、穩定的區別欄位。
 */
function normalizeOne(eq: CwaEarthquakeRecord): Earthquake {
  const areas: EarthquakeShakingArea[] = (eq.Intensity.ShakingArea ?? [])
    .filter((a) => !a.AreaDesc.startsWith('最大震度'))
    .map((a) => ({
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
