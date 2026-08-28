import { describe, expect, it } from 'vitest'
import { climateNormalStationId, normalizeClimateComparison } from '../climate'

describe('climateNormalStationId', () => {
  it('高雄現站 467441 的氣候常態改打舊前鎮站 467440', () => {
    expect(climateNormalStationId('467441')).toBe('467440')
  })

  it('其餘測站常態站號與現站相同', () => {
    expect(climateNormalStationId('466920')).toBe('466920')
  })
})

describe('normalizeClimateComparison', () => {
  it('C-B0024 或 C-B0027 缺測站（空 location）時回 null，而不是丟例外', () => {
    const recent = { records: { location: [] } }
    const normal = { records: { data: { surfaceObs: { location: [] } } } }
    expect(normalizeClimateComparison(recent as never, normal as never)).toBeNull()
  })

  it('C-B0027 缺 surfaceObs 這種不完整結構時回 null，而不是丟例外', () => {
    const recent = {
      records: {
        location: [
          {
            station: { StationID: '467290', StationName: '古坑' },
            stationObsTimes: { stationObsTime: [] }
          }
        ]
      }
    }
    const normal = { records: {} }
    expect(normalizeClimateComparison(recent as never, normal as never)).toBeNull()
  })
})
