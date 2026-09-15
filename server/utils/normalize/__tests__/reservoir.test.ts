import { describe, expect, it } from 'vitest'
import { normalizeReservoirCapacities, normalizeReservoirStatuses } from '../reservoir'

// 節錄自實際回應（2026-09-15 實測，這個平台不需要金鑰）：石門水庫（10201）同一批回應裡
// 混雜三個不同 observationtime，故意打散順序，用來鎖住「只取每站最新一筆」的邏輯
const STATUS_RAW = [
  {
    reservoiridentifier: '10201',
    observationtime: '2026-09-14T18:00:00',
    waterlevel: '245.07',
    effectivewaterstoragecapacity: '20586.79',
    inflowdischarge: '48.2',
    totaloutflow: '158.06'
  },
  {
    reservoiridentifier: '10201',
    observationtime: '2026-09-15T16:00:00',
    waterlevel: '245.06',
    effectivewaterstoragecapacity: '20578.15',
    inflowdischarge: '35.1',
    totaloutflow: '0.0'
  },
  {
    reservoiridentifier: '10201',
    observationtime: '2026-09-14T17:00:00',
    waterlevel: '245.12',
    effectivewaterstoragecapacity: '20630.25',
    inflowdischarge: '59.1',
    totaloutflow: '0.0'
  },
  // 節錄自實際回應：新山水庫（10204），單一時間點
  {
    reservoiridentifier: '10204',
    observationtime: '2026-09-15T07:00:00',
    waterlevel: '84.59',
    effectivewaterstoragecapacity: '924.14',
    inflowdischarge: '',
    totaloutflow: '0.0'
  },
  // 節錄自實際回應：代碼 50303，沒有公告容量規格、也不在 RESERVOIR_COORDS 裡的小型埤塘
  {
    reservoiridentifier: '50303',
    observationtime: '2026-09-15T08:00:00',
    waterlevel: '3.85',
    effectivewaterstoragecapacity: '0.12',
    inflowdischarge: '',
    totaloutflow: '0.0'
  }
]

// 節錄自實際回應：水庫基本資料，注意石門水庫的「目前有效容量」帶千分位逗號
const CAPACITY_RAW = [
  { 水庫代碼: 10201, 目前有效容量: '20,441.10' },
  { 水庫代碼: 10204, 目前有效容量: '996' }
]

describe('normalizeReservoirCapacities', () => {
  it('把帶千分位逗號的容量字串轉成數字，用水庫代碼（數字轉字串）當 key', () => {
    const capacities = normalizeReservoirCapacities(CAPACITY_RAW as never)
    expect(capacities).toEqual({ '10201': 20441.1, '10204': 996 })
  })
})

describe('normalizeReservoirStatuses', () => {
  it('同一水庫混雜多個觀測時間點時，只取 observationtime 最新的一筆', () => {
    const capacities = normalizeReservoirCapacities(CAPACITY_RAW as never)
    const stations = normalizeReservoirStatuses(STATUS_RAW as never, capacities)
    const shimen = stations.find((s) => s.id === '10201')
    expect(shimen).toMatchObject({ observationTime: '2026-09-15T16:00:00+08:00', waterLevel: 245.06, inflow: 35.1 })
  })

  it('算出蓄水率＝即時有效蓄水量 ÷ 目前有效容量 × 100，四捨五入到小數點一位', () => {
    const capacities = normalizeReservoirCapacities(CAPACITY_RAW as never)
    const stations = normalizeReservoirStatuses(STATUS_RAW as never, capacities)
    const xinshan = stations.find((s) => s.id === '10204')
    // 924.14 / 996 * 100 = 92.79...
    expect(xinshan!.storagePercentage).toBe(92.8)
  })

  it('找不到座標對照（RESERVOIR_COORDS 沒有這個代碼）的水庫直接濾掉', () => {
    const capacities = normalizeReservoirCapacities(CAPACITY_RAW as never)
    const stations = normalizeReservoirStatuses(STATUS_RAW as never, capacities)
    expect(stations.find((s) => s.id === '50303')).toBeUndefined()
  })

  it('找不到容量規格（capacities 查不到）時蓄水率為 null，不影響水位等其餘欄位', () => {
    const stations = normalizeReservoirStatuses(STATUS_RAW as never, {})
    const shimen = stations.find((s) => s.id === '10201')
    expect(shimen).toMatchObject({ storagePercentage: null, waterLevel: 245.06 })
  })
})
