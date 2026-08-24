import type { Coordinates } from '#shared/types'

const EARTH_RADIUS_KM = 6371

/** 把「以某經緯度為圓心、半徑 X 公里」轉成一圈近似的經緯度點（供不確定性錐這類外包絡計算使用） */
export function circlePoints(center: Coordinates, radiusKm: number, segments = 16): Array<[number, number]> {
  const latRad = (center.lat * Math.PI) / 180
  const kmPerDegLat = (Math.PI * EARTH_RADIUS_KM) / 180
  const kmPerDegLon = kmPerDegLat * Math.cos(latRad)

  const points: Array<[number, number]> = []
  for (let i = 0; i < segments; i++) {
    const theta = (2 * Math.PI * i) / segments
    const dLat = (radiusKm * Math.cos(theta)) / kmPerDegLat
    const dLon = (radiusKm * Math.sin(theta)) / kmPerDegLon
    points.push([center.lon + dLon, center.lat + dLat])
  }
  return points
}

/** Andrew's monotone chain：計算一組點的凸包，回傳封閉環（首尾同點） */
export function convexHull(points: Array<[number, number]>): Array<[number, number]> {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length <= 2) return [...pts, pts[0]].filter((p): p is [number, number] => !!p)

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

  const lower: Array<[number, number]> = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Array<[number, number]> = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  const hull = [...lower, ...upper]
  return [...hull, hull[0]!]
}
