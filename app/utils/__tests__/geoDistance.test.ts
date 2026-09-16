import { describe, expect, it } from 'vitest'
import { findNearest, haversineKm } from '../geoDistance'

describe('geoDistance', () => {
  const TAIPEI_101 = { lat: 25.0339, lon: 121.5645 }
  const TAIPEI_MAIN_STATION = { lat: 25.0478, lon: 121.517 }
  const KAOHSIUNG_STATION = { lat: 22.6397, lon: 120.3026 }

  it('haversineKm 同一點距離為 0', () => {
    expect(haversineKm(TAIPEI_101, TAIPEI_101)).toBe(0)
  })

  it('haversineKm 計算台北 101 至台北車站約 5-6 公里', () => {
    const dist = haversineKm(TAIPEI_101, TAIPEI_MAIN_STATION)
    expect(dist).toBeGreaterThan(5)
    expect(dist).toBeLessThan(6)
  })

  it('haversineKm 計算台北至高雄約 290-310 公里', () => {
    const dist = haversineKm(TAIPEI_101, KAOHSIUNG_STATION)
    expect(dist).toBeGreaterThan(290)
    expect(dist).toBeLessThan(310)
  })

  it('findNearest 候選清單為空時回傳 null', () => {
    expect(findNearest(TAIPEI_101, [])).toBeNull()
  })

  it('findNearest 能正確挑出最近的候選目標', () => {
    const candidates = [
      { id: 'kaohsiung', coordinates: KAOHSIUNG_STATION },
      { id: 'taipei_station', coordinates: TAIPEI_MAIN_STATION }
    ]
    const nearest = findNearest(TAIPEI_101, candidates)
    expect(nearest).not.toBeNull()
    expect(nearest?.id).toBe('taipei_station')
  })
})
