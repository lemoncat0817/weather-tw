import type {
  ColdInjuryTownForecast,
  HealthIndexLevel,
  HealthIndexTownForecast,
  HeatInjuryTownForecast,
  TemperatureDifferenceTownForecast
} from '#shared/types'

// ---------------------------------------------------------------------------
// 健康氣象系列：熱傷害（M-A0085-001）、冷傷害（F-A0085-003）、溫差提醒（F-A0085-005）
// 是同一套系統依相同殼架構產生的三個因子，只有 WeatherElements 底下的指數/警示欄位
// 名稱不同，共用同一份 normalizer 骨架（見 makeHealthIndexNormalizers）。
// ---------------------------------------------------------------------------

interface CwaHealthTime {
  IssueTime: string
  WeatherElements: Record<string, number | string>
}
interface CwaHealthLocation {
  TownName: string
  Geocode: string
  Latitude: string
  Longitude: string
  Time: CwaHealthTime[]
}
interface CwaHealthCounty {
  CountyName: string
  Location: CwaHealthLocation[]
}
interface CwaHealthResponse {
  records: { Locations: CwaHealthCounty[] }
}

// CWA 只用這五種字串（含空字串代表「無」），三個健康氣象因子共用同一套官方四級警示，
// 實測全台回應涵蓋過這五種，見 __tests__/health.test.ts。溫差提醒（F-A0085-005）的
// 官方文件沒有附四級門檻對照表（不像熱/冷傷害各有輔助說明 PDF），沿用同一份對照表；
// 若 CWA 對溫差提醒實際用不同 wording，未知字串一律安全退為 none，只影響顏色分級，
// 指數本身不受影響。
const WARNING_LEVEL: Record<string, HealthIndexLevel> = {
  '': 'none',
  注意: 'caution',
  警戒: 'watch',
  危險: 'danger',
  高危險: 'high-danger'
}

/**
 * 同一個 WeatherElements 殼子，三個資料集的 IssueTime 格式卻不一致（實測發現）：
 * 熱傷害／冷傷害是 naive 的 "YYYY-MM-DD HH:MM:SS"（實際是台北時間，要自己補 +08:00，
 * 跟 warning.ts 處理 validTime 是同一個既有陷阱），但溫差提醒（F-A0085-005）的 IssueTime
 * 已經自帶 "+08:00"——照樣硬補會疊成 "+08:00+08:00"。用是否已經帶時區位移判斷，
 * 不假設任何一種格式一定適用於全部三個資料集。
 */
function toTaipeiIso(raw: string): string {
  const isoLike = raw.replace(' ', 'T')
  return /[+-]\d{2}:\d{2}$/.test(isoLike) ? isoLike : `${isoLike}+08:00`
}

/**
 * 建立一組健康氣象因子的 summary/town normalizer。三個資料集的 WeatherElements 只有
 * 指數欄位（如 HeatInjuryIndex）與警示欄位（如 HeatInjuryWarning）名稱不同，其餘巢狀
 * 結構、時區處理、排序需求完全一致，用欄位名稱參數化避免三份幾乎一樣的實作。
 */
function makeHealthIndexNormalizers<T extends HealthIndexTownForecast>(indexField: string, warningField: string) {
  // 實測 CWA 回傳的 Time 陣列在鄉鎮之間順序不一致（同一組時間點，但打散排列）——若直接照
  // 原始順序用陣列 index 在多個鄉鎮之間對齊（choropleth 時間軸就是這樣做的），會把不同鄉鎮
  // 的不同時間點誤判成「同一格」。明確依時間重新排序，呼叫端不需要、也不應該自己再排。
  function toReadings(times: CwaHealthTime[]): HealthIndexTownForecast['readings'] {
    return times
      .map((t) => ({
        time: toTaipeiIso(t.IssueTime),
        index: Number(t.WeatherElements[indexField]),
        level: WARNING_LEVEL[String(t.WeatherElements[warningField] ?? '')] ?? 'none'
      }))
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  function toTown(county: string, loc: CwaHealthLocation): T {
    return {
      county,
      town: loc.TownName,
      coordinates: { lat: Number(loc.Latitude), lon: Number(loc.Longitude) },
      readings: toReadings(loc.Time)
    } as T
  }

  return {
    /** 全台鄉鎮摘要（choropleth + 時間軸用）：不帶 CountyName 時 CWA 回傳全部 22 縣市、368 鄉鎮 */
    summary: (raw: CwaHealthResponse): T[] =>
      raw.records.Locations.flatMap((c) => c.Location.map((loc) => toTown(c.CountyName, loc))),
    /** 單一鄉鎮明細：呼叫端帶 CountyName + TownName 篩選，只會有一個縣市、一個鄉鎮 */
    town: (raw: CwaHealthResponse): T | null => {
      const county = raw.records.Locations[0]
      const loc = county?.Location[0]
      if (!county || !loc) return null
      return toTown(county.CountyName, loc)
    }
  }
}

const heat = makeHealthIndexNormalizers<HeatInjuryTownForecast>('HeatInjuryIndex', 'HeatInjuryWarning')
export const normalizeHeatInjurySummary = heat.summary
export const normalizeHeatInjuryTown = heat.town

const cold = makeHealthIndexNormalizers<ColdInjuryTownForecast>('ColdInjuryIndex', 'ColdInjuryWarning')
export const normalizeColdInjurySummary = cold.summary
export const normalizeColdInjuryTown = cold.town

const temperatureDifference = makeHealthIndexNormalizers<TemperatureDifferenceTownForecast>(
  'TemperatureDifferenceIndex',
  'TemperatureDifferenceWarning'
)
export const normalizeTemperatureDifferenceSummary = temperatureDifference.summary
export const normalizeTemperatureDifferenceTown = temperatureDifference.town
