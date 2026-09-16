import { describe, expect, it } from 'vitest'
import {
  normalizeInundationSensors,
  parseInundationSeverity,
  type RawInundationRecord
} from '../inundation'

const RAW_SENSORS: RawInundationRecord[] = [
  {
    sensorid: 's-001',
    latestvalue: '0',
    timestamp: '2026-09-16T11:20:00+08:00',
    areacode: '65000040',
    countycode: '65000' // 新北市
  },
  {
    sensorid: 's-002',
    latestvalue: '12.5',
    timestamp: '2026-09-16T11:25:00+08:00',
    areacode: '64000210',
    countycode: '64000' // 高雄市
  },
  {
    sensorid: 's-003',
    latestvalue: '25.0',
    timestamp: '2026-09-16T11:26:00+08:00',
    areacode: '10010050',
    countycode: '10010' // 嘉義縣
  },
  {
    sensorid: 's-004',
    latestvalue: '-1', // 異常值，應為 0
    timestamp: '2026-09-16T11:20:00+08:00',
    areacode: '68000080',
    countycode: '68000' // 桃園市
  },
  {
    sensorid: 's-005',
    latestvalue: '999.9', // 感測器離線／故障的哨兵值，應視同無資料
    timestamp: '2026-05-20T12:18:13+08:00',
    areacode: '67000270',
    countycode: '67000' // 臺南市
  }
]

describe('normalizeInundationSensors', () => {
  it('正確統計總數與積淹水點數量，過濾 depth > 0', () => {
    const res = normalizeInundationSensors(RAW_SENSORS)
    expect(res.totalSensors).toBe(5)
    expect(res.activeInundationCount).toBe(2)
    expect(res.activeSensors).toHaveLength(2)

    // 依水深降序排列：25.0cm (嘉義縣) -> 12.5cm (高雄市)
    expect(res.activeSensors[0]!.sensorId).toBe('s-003')
    expect(res.activeSensors[0]!.depthCm).toBe(25.0)
    expect(res.activeSensors[0]!.severity).toBe('critical')
    expect(res.activeSensors[0]!.county).toBe('嘉義縣')

    expect(res.activeSensors[1]!.sensorId).toBe('s-002')
    expect(res.activeSensors[1]!.depthCm).toBe(12.5)
    expect(res.activeSensors[1]!.severity).toBe('warning')
    expect(res.activeSensors[1]!.county).toBe('高雄市')
  })

  it('感測器離線／故障哨兵值（999.9）不視為真實積水，不計入告警', () => {
    const res = normalizeInundationSensors(RAW_SENSORS)
    expect(res.activeSensors.some((s) => s.sensorId === 's-005')).toBe(false)
  })

  it('parseInundationSeverity 等級判定', () => {
    expect(parseInundationSeverity(0)).toBe('none')
    expect(parseInundationSeverity(5)).toBe('warning')
    expect(parseInundationSeverity(19.9)).toBe('warning')
    expect(parseInundationSeverity(20.0)).toBe('critical')
    expect(parseInundationSeverity(45.0)).toBe('critical')
  })
})
