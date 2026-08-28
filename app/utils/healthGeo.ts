import type { GeoFeatureCollection, GeoPolygon, HeatInjuryTownForecast } from '#shared/types'

export interface HeatInjuryTownProperties {
  county: string
  town: string
  index: number
  level: string
}

/**
 * 把鄉鎮邊界 GeoJSON（/data/taiwan-towns.geojson）與熱傷害指數摘要在指定時間點 join 起來，
 * 回傳可直接餵給 MapLibre fill layer 的 FeatureCollection。兩份資料透過 county+town 字串比對
 * （跟 /map 頁的溫度 choropleth 是同一個 join 手法），找不到對應資料的鄉鎮直接濾掉。
 */
export function joinHeatInjuryBoundaries(
  boundaries: GeoFeatureCollection<GeoPolygon, { county: string; town: string }>,
  towns: HeatInjuryTownForecast[],
  timeIndex: number
): GeoFeatureCollection<GeoPolygon, HeatInjuryTownProperties> {
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
