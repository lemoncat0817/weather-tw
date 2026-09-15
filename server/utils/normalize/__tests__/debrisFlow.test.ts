import { describe, expect, it } from 'vitest'
import { normalizeDebrisFlowHistory, normalizeDebrisFlowLiveAlerts } from '../debrisFlow'

// 節錄自實際回應（2026-09 實測，農業部農村發展及水土保持署，這個平台不需要金鑰）：
// 刻意打散時間順序，用來鎖住「依 updateTime 重新排序」的邏輯
const HISTORY_RAW = [
  {
    AlertType: 'D',
    DebrisNo: '高市DF119',
    LandslideID: '-',
    LandslideName: '-',
    County: '高雄市',
    Town: '六龜區',
    Vill: '中興里',
    AlertLevel: 'y',
    LastUpdateDate: '2026-09-02 00:14',
    ReportID: '115K-4-0'
  },
  {
    // 大規模崩塌：DebrisNo 是 "-"（不適用），Vill 也是 "-"（沒有細分村里）
    AlertType: 'L',
    DebrisNo: '-',
    LandslideID: 'DS009',
    LandslideName: '屏東縣-來義鄉-T001(來義)',
    County: '屏東縣',
    Town: '來義鄉',
    Vill: '-',
    AlertLevel: 'r',
    LastUpdateDate: '2026-08-25 15:29',
    ReportID: '115I-22-0'
  },
  {
    AlertType: 'D',
    DebrisNo: '高市DF086',
    LandslideID: '-',
    LandslideName: '-',
    County: '高雄市',
    Town: '那瑪夏區',
    Vill: '瑪雅里',
    AlertLevel: 'y',
    LastUpdateDate: '2026-06-09 06:11',
    ReportID: '115C-4-0'
  }
]

describe('normalizeDebrisFlowHistory', () => {
  it('土石流警戒（type D）沒有獨立可讀名稱，id/name 都用 DebrisNo', () => {
    const alerts = normalizeDebrisFlowHistory(HISTORY_RAW as never)
    const debris = alerts.find((a) => a.id === '高市DF119')
    expect(debris).toMatchObject({ type: 'debris', name: '高市DF119', county: '高雄市', town: '六龜區', village: '中興里', level: 'yellow' })
  })

  it('大規模崩塌（type L）用 LandslideID 當 id、LandslideName 當 name；沒有細分村里時 village 為 null', () => {
    const alerts = normalizeDebrisFlowHistory(HISTORY_RAW as never)
    const landslide = alerts.find((a) => a.id === 'DS009')
    expect(landslide).toMatchObject({
      type: 'landslide',
      name: '屏東縣-來義鄉-T001(來義)',
      county: '屏東縣',
      town: '來義鄉',
      village: null,
      level: 'red'
    })
  })

  it('把沒帶秒數、沒帶時區的 LastUpdateDate 轉成明確帶 +08:00 的 ISO 字串', () => {
    const alerts = normalizeDebrisFlowHistory(HISTORY_RAW as never)
    const debris = alerts.find((a) => a.id === '高市DF119')
    expect(debris!.updateTime).toBe('2026-09-02T00:14:00+08:00')
  })

  it('不假設上游回傳順序已經排好，依 updateTime 重新排序（新到舊）', () => {
    const alerts = normalizeDebrisFlowHistory(HISTORY_RAW as never)
    expect(alerts.map((a) => a.reportId)).toEqual(['115K-4-0', '115I-22-0', '115C-4-0'])
  })
})

describe('normalizeDebrisFlowLiveAlerts', () => {
  it('平時無警戒時回傳空陣列，不是拋例外', () => {
    expect(normalizeDebrisFlowLiveAlerts([] as never)).toEqual([])
  })

  it('欄位取自官方欄位字典（county/town 小寫開頭，跟歷史紀錄資料集不同），一樣能正確轉換', () => {
    const raw = [
      {
        AlertType: 'D',
        DebrisNo: '北市DF029',
        LandslideID: '-',
        LandslideName: '-',
        county: '臺北市',
        town: '北投區',
        Vill: '湖田里',
        AlertLevel: 'r',
        LastUpdateDate: '2026-09-01 12:00',
        ReportID: '115K-1-0'
      }
    ]
    const [alert] = normalizeDebrisFlowLiveAlerts(raw as never)
    expect(alert).toMatchObject({ id: '北市DF029', type: 'debris', county: '臺北市', town: '北投區', level: 'red' })
  })
})
