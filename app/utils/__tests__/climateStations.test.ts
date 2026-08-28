import { describe, expect, it } from 'vitest'
import { CLIMATE_STATIONS, DEFAULT_CLIMATE_STATION_ID, isClimateStationId } from '../climateStations'

describe('CLIMATE_STATIONS', () => {
  it('不列出 C-B0024／C-B0027 成對查詢會 404 的測站', () => {
    const ids = CLIMATE_STATIONS.map((s) => s.id)
    // 新站，沒有 1991-2020 常態
    expect(ids).not.toContain('466881') // 新北
    expect(ids).not.toContain('467050') // 新屋
    expect(ids).not.toContain('467270') // 田中
    expect(ids).not.toContain('467280') // 後龍
    expect(ids).not.toContain('467290') // 古坑
    // 成對查詢空回
    expect(ids).not.toContain('467110') // 金門
    expect(ids).not.toContain('467990') // 馬祖
  })

  it('高雄現站仍在選單（常態走舊站號 467440）', () => {
    expect(CLIMATE_STATIONS.some((s) => s.id === '467441' && s.name === '高雄')).toBe(true)
  })

  it('預設測站在清單裡', () => {
    expect(isClimateStationId(DEFAULT_CLIMATE_STATION_ID)).toBe(true)
  })
})
