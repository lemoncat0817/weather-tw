import type { GeoFeatureCollection, GeoPoint, Observation } from '#shared/types'

export interface FlatStationProperties {
  stationName: string
  county: string
  town: string
  temperature: number
}

export type StationMetric = 'temperature' | 'precipitation' | 'windSpeed' | 'relativeHumidity'

export interface FlatStationMetricProperties {
  stationName: string
  county: string
  town: string
  value: number
}

/**
 * MapLibre 的 interpolate expression 拿到 null 會整個評估失敗，缺溫度的測站（例如純雨量站）
 * 直接濾掉不畫點；同時把巢狀的 reading.temperature 攤平成頂層欄位，供 style expression／
 * table 欄位直接用 ['get', 'temperature'] 存取（style expression 沒辦法處理巢狀路徑）。
 * `/map` 跟 `/observation` 都要用同一份測站點資料，抽成共用函式避免兩邊各寫一次、日後改一邊漏一邊。
 */
export function flattenStationsForMap(
  fc: GeoFeatureCollection<GeoPoint, Observation>
): GeoFeatureCollection<GeoPoint, FlatStationProperties> {
  return {
    type: 'FeatureCollection',
    features: fc.features
      .filter((f) => f.properties.reading.temperature !== null)
      .map((f) => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: {
          stationName: f.properties.stationName,
          county: f.properties.county,
          town: f.properties.town,
          temperature: f.properties.reading.temperature as number
        }
      }))
  }
}

/**
 * 依指定量測值攤平測站點，供 /observation 頁在「氣象站（溫度）」跟「雨量站（雨量）」間切換用——
 * 雨量站幾乎不回報溫度（reading.temperature 恆為 null），若固定用溫度欄位，雨量站會被濾成空地圖，
 * 所以量測欄位本身也要能換。
 */
export function flattenStationsByMetric(
  fc: GeoFeatureCollection<GeoPoint, Observation>,
  metric: StationMetric
): GeoFeatureCollection<GeoPoint, FlatStationMetricProperties> {
  return {
    type: 'FeatureCollection',
    features: fc.features
      .filter((f) => f.properties.reading[metric] !== null)
      .map((f) => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: {
          stationName: f.properties.stationName,
          county: f.properties.county,
          town: f.properties.town,
          value: f.properties.reading[metric] as number
        }
      }))
  }
}
