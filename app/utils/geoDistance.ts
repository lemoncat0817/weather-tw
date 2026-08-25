import type { Coordinates } from '#shared/types'

/**
 * Haversine 距離（公里）。台灣本島＋離島的經緯度跨距很小，球面近似的誤差可忽略，
 * 不需要用橢球模型（Vincenty 之類），對「找最近鄉鎮」這種用途來說是過度工程。
 */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** 給定一個座標點，在候選清單裡找距離最近的一個（用重心點比對，不是精確的行政區邊界判斷，
 *  但對「猜使用者在哪個鄉鎮」這種用途已經夠準——鄉鎮範圍通常遠大於重心點誤差） */
export function findNearest<T extends { coordinates: Coordinates }>(point: Coordinates, candidates: T[]): T | null {
  let nearest: T | null = null
  let minDist = Infinity
  for (const c of candidates) {
    const d = haversineKm(point, c.coordinates)
    if (d < minDist) {
      minDist = d
      nearest = c
    }
  }
  return nearest
}
