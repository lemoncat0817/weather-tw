import { describe, expect, it } from 'vitest'
import { normalizeRiverStationMeta, normalizeRiverStations } from '../river'

// 節錄自實際回應（2026-09-15 實測，這個平台不需要金鑰）
const META_RAW = [
  {
    // 台北橋（淡水河），三級門檻齊全
    observatoryidentifier: '3132020RV1140H029', // 實際格式是流域前綴＋後 8 碼站號，join 只看後 8 碼
    observatoryname: '台北橋',
    rivername: '淡水河',
    locationbytwd97_xy: '300945.82 2771605.79',
    alertlevel1: '8.5',
    alertlevel2: '6.7',
    alertlevel3: '2.2'
  },
  {
    // 大崙（新武呂溪），只公告兩級門檻（level3 缺）
    observatoryidentifier: '3132020RVDALUN029',
    observatoryname: '大崙',
    rivername: '新武呂溪',
    locationbytwd97_xy: '262218.94 2559056.91',
    alertlevel1: '374.7',
    alertlevel2: '374.1',
    alertlevel3: ''
  },
  {
    // 座標欄位是空字串（實測會出現的缺值情況），join 時應該連不上——這筆刻意不放進即時水位測試資料裡
    observatoryidentifier: '3132020RVNOCOORD1',
    observatoryname: '無座標測站',
    rivername: '不存在溪',
    locationbytwd97_xy: '',
    alertlevel1: '',
    alertlevel2: '',
    alertlevel3: ''
  }
]

describe('normalizeRiverStationMeta', () => {
  it('用 observatoryidentifier 的後 8 碼當查表 key，並把 TWD97 二度分帶座標轉成經緯度', () => {
    const meta = normalizeRiverStationMeta(META_RAW as never)
    const taipeiBridge = meta['1140H029']
    expect(taipeiBridge).toBeDefined()
    expect(taipeiBridge!.name).toBe('台北橋')
    // 台北橋位於淡水河上，新北市三重／台北市大同區交界，實際換算結果 (121.505, 25.052)
    expect(taipeiBridge!.coordinates.lat).toBeCloseTo(25.05, 1)
    expect(taipeiBridge!.coordinates.lon).toBeCloseTo(121.5, 1)
  })

  it('座標欄位是空字串時，該測站不會出現在查表裡', () => {
    const meta = normalizeRiverStationMeta(META_RAW as never)
    expect(meta['NOCOORD1']).toBeUndefined()
  })

  it('只公告兩級門檻的測站，缺的那一級是 null 不是空字串', () => {
    const meta = normalizeRiverStationMeta(META_RAW as never)
    const dalun = meta['DALUN029']
    expect(dalun).toMatchObject({ alertLevel1: 374.7, alertLevel2: 374.1, alertLevel3: null })
  })
})

describe('normalizeRiverStations', () => {
  const meta = normalizeRiverStationMeta(META_RAW as never)

  it('checkresult 為 "false" 的異常讀值（實測：高於堤頂高）視為沒有讀值，不誤判成警戒', () => {
    // 節錄自實際回應：台北橋這筆讀值 14.46m 遠超一級門檻 8.5m，但上游自己標註為異常
    const raw = [
      { stationid: '1140H029', datetime: '2026-09-15T18:50:00', waterlevel: '14.46', checkresult: 'false' }
    ]
    const [station] = normalizeRiverStations(raw as never, meta)
    expect(station).toMatchObject({ waterLevel: null, alertLevel: 'unavailable' })
  })

  it('正常讀值依三級門檻由低到高分類（level3 最先觸發、level1 最嚴重）', () => {
    const raw = [
      { stationid: '1140H029', datetime: '2026-09-15T18:50:00', waterlevel: '1.0', checkresult: 'true' },
      { stationid: '1140H029', datetime: '2026-09-15T18:50:00', waterlevel: '3.0', checkresult: 'true' },
      { stationid: '1140H029', datetime: '2026-09-15T18:50:00', waterlevel: '7.0', checkresult: 'true' },
      { stationid: '1140H029', datetime: '2026-09-15T18:50:00', waterlevel: '9.0', checkresult: 'true' }
    ]
    const stations = normalizeRiverStations(raw as never, meta)
    expect(stations.map((s) => s.alertLevel)).toEqual(['normal', 'level3', 'level2', 'level1'])
  })

  it('三級門檻都沒公告的測站視為 unavailable，不是 normal——沒有門檻資料跟「正常」是兩回事', () => {
    const rawMeta = normalizeRiverStationMeta([
      {
        observatoryidentifier: '3132020RVNOALERT1',
        observatoryname: '無門檻測站',
        rivername: '測試溪',
        locationbytwd97_xy: '262218.94 2559056.91',
        alertlevel1: '',
        alertlevel2: '',
        alertlevel3: ''
      }
    ] as never)
    const raw = [{ stationid: 'NOALERT1', datetime: '2026-09-15T18:50:00', waterlevel: '5.0', checkresult: 'true' }]
    const [station] = normalizeRiverStations(raw as never, rawMeta)
    expect(station!.alertLevel).toBe('unavailable')
  })

  it('即時水位裡站號在站況查表找不到對應（未收錄或已廢站）的測站直接濾掉', () => {
    const raw = [{ stationid: '9999999X', datetime: '2026-09-15T18:50:00', waterlevel: '5.0', checkresult: 'true' }]
    const stations = normalizeRiverStations(raw as never, meta)
    expect(stations).toHaveLength(0)
  })
})
