import type { GeoFeatureCollection, GeoPolygon, HealthIndexTownForecast } from '#shared/types'

export interface HealthIndexTownProperties {
  county: string
  town: string
  index: number
  level: string
}

/**
 * 把鄉鎮邊界 GeoJSON（/data/taiwan-towns.geojson）與健康氣象指數摘要在指定時間點 join 起來，
 * 回傳可直接餵給 MapLibre fill layer 的 FeatureCollection。三個健康氣象因子（熱傷害/冷傷害/
 * 溫差提醒）形狀相同，共用同一個 join 函式。兩份資料透過 county+town 字串比對
 * （跟 /map 頁的溫度 choropleth 是同一個 join 手法），找不到對應資料的鄉鎮直接濾掉。
 */
export function joinHealthIndexBoundaries(
  boundaries: GeoFeatureCollection<GeoPolygon, { county: string; town: string }>,
  towns: HealthIndexTownForecast[],
  timeIndex: number
): GeoFeatureCollection<GeoPolygon, HealthIndexTownProperties> {
  const byKey = new Map(towns.map((t) => [`${t.county}-${t.town}`, t]))
  return {
    type: 'FeatureCollection',
    features: boundaries.features
      .map((f) => {
        const town = byKey.get(`${f.properties.county}-${f.properties.town}`)
        const reading = town?.readings[timeIndex]
        if (!town || !reading) return null
        return {
          type: 'Feature' as const,
          geometry: f.geometry,
          properties: { county: f.properties.county, town: f.properties.town, index: reading.index, level: reading.level }
        }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
  }
}
