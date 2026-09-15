import { describe, expect, it } from 'vitest'
import { normalizeTsunamiReports } from '../tsunami'

// 節錄自 E-A0014-001 實際回應：「海嘯消息」（威脅已解除的通報）沒有 TsunamiWave 欄位
const INFO_ONLY_RAW = {
  records: {
    Tsunami: [
      {
        IssueTime: '2026-07-28T16:28:00+08:00',
        ValidTime: { EndTime: '2026-07-29T00:28:00+08:00' },
        ReportColor: '綠色',
        ReportContent: '頃獲太平洋海嘯警報中心通報，針對０７月２８日１５時２８分（臺灣時間）日本　九州島規模７．１地震，確認解除太平洋地區的海嘯威脅。',
        ReportNo: '第2報',
        ReportType: '海嘯消息',
        TsunamiNo: 115005,
        Web: 'https://scweb.cwa.gov.tw/webdata/OLDTSU/11500502/Tsu11500502.htm',
        EarthquakeInfo: {
          OriginTime: '2026-07-28T15:28:00+08:00',
          Source: '美國太平洋海嘯警報中心',
          FocalDepth: 10.0,
          Epicenter: { Location: '日本　九州島', EpicenterLatitude: 32.6, EpicenterLongitude: 130.7 },
          EarthquakeMagnitude: { MagnitudeValue: 7.1 }
        }
      }
    ]
  }
}

// 節錄自 E-A0014-001 實際回應：「海嘯警報解除」——已有實測波高（TsuStation），但沒有
// 警戒分區的預估波（WarningArea 為空陣列，因為威脅已經過去，不再需要預估）
const OBSERVED_ONLY_RAW = {
  records: {
    Tsunami: [
      {
        IssueTime: '2025-07-30T17:10:00+08:00',
        ValidTime: { EndTime: '2025-07-31T01:10:00+08:00' },
        ReportColor: '紅色',
        ReportContent: '根據中央氣象署潮位站觀測，海嘯波浪已經陸續抵達沿岸，經研判海嘯的威脅解除，故解除海嘯警報。',
        ReportNo: '第5報',
        ReportType: '海嘯警報解除',
        TsunamiNo: 114005,
        Web: 'https://scweb.cwa.gov.tw/webdata/OLDTSU/11400505/Tsu11400505.htm',
        EarthquakeInfo: {
          OriginTime: '2025-07-30T07:25:00+08:00',
          Source: '美國太平洋海嘯警報中心',
          FocalDepth: 74.0,
          Epicenter: { Location: '俄羅斯　堪察加半島東部外海', EpicenterLatitude: 52.2, EpicenterLongitude: 160.0 },
          EarthquakeMagnitude: { MagnitudeValue: 8.8 }
        },
        TsunamiWave: {
          WarningArea: [],
          TsuStation: [
            {
              ArrivalTime: '2025-07-30T17:00:00+08:00',
              InfoStatus: 'observe',
              StationID: 'CK',
              StationName: '臺東成功',
              StationLatitude: 23.09,
              StationLongitude: 121.38,
              WaveHeight: '7公分'
            }
          ]
        }
      }
    ]
  }
}

// 節錄自 E-A0014-001 實際回應：「海嘯警報」——警戒分區的預估波（WarningArea），
// 對應官方海嘯警戒分區劃分表的 6 個分區之一
const WARNING_AREA_RAW = {
  records: {
    Tsunami: [
      {
        IssueTime: '2025-07-30T11:40:00+08:00',
        ValidTime: { EndTime: '2025-07-30T19:40:00+08:00' },
        ReportColor: '紅色',
        ReportContent: '經本署研判，該地震所引發海嘯預計約於０７月３０日１３時１８分開始影響臺灣，特此發布海嘯警報。',
        ReportNo: '第4報',
        ReportType: '海嘯警報',
        TsunamiNo: 114005,
        Web: 'https://scweb.cwa.gov.tw/webdata/OLDTSU/11400504/Tsu11400504.htm',
        EarthquakeInfo: {
          OriginTime: '2025-07-30T07:25:00+08:00',
          Source: '美國太平洋海嘯警報中心',
          FocalDepth: 74.0,
          Epicenter: { Location: '俄羅斯　堪察加半島東部外海', EpicenterLatitude: 52.2, EpicenterLongitude: 160.0 },
          EarthquakeMagnitude: { MagnitudeValue: 8.7 }
        },
        TsunamiWave: {
          WarningArea: [
            {
              AreaColor: '黃色',
              AreaDesc: '臺東縣成功鎮至屏東縣滿州鄉沿岸',
              AreaName: '東南沿海地區',
              ArrivalTime: '2025-07-30T13:19:00+08:00',
              InfoStatus: 'predict',
              WaveHeight: '0.3至1公尺'
            }
          ],
          TsuStation: []
        }
      }
    ]
  }
}

describe('normalizeTsunamiReports', () => {
  it('「海嘯消息」沒有 TsunamiWave 欄位時，warningAreas/stations 回傳空陣列，不是拋例外', () => {
    const [report] = normalizeTsunamiReports(INFO_ONLY_RAW as never)
    expect(report).toMatchObject({
      id: '115005-2026-07-28T16:28:00+08:00',
      reportType: '海嘯消息',
      reportColor: '綠色',
      warningAreas: [],
      stations: []
    })
    expect(report!.earthquake).toMatchObject({ magnitude: 7.1, depthKm: 10.0 })
  })

  it('讀出 TsuStation 的實測波高與座標', () => {
    const [report] = normalizeTsunamiReports(OBSERVED_ONLY_RAW as never)
    expect(report!.warningAreas).toEqual([])
    expect(report!.stations).toEqual([
      {
        stationId: 'CK',
        stationName: '臺東成功',
        position: { lat: 23.09, lon: 121.38 },
        arrivalTime: '2025-07-30T17:00:00+08:00',
        waveHeight: '7公分',
        infoStatus: 'observe'
      }
    ])
  })

  it('讀出 WarningArea 的預估到達時間與波高分級', () => {
    const [report] = normalizeTsunamiReports(WARNING_AREA_RAW as never)
    expect(report!.stations).toEqual([])
    expect(report!.warningAreas).toEqual([
      {
        areaName: '東南沿海地區',
        areaDescription: '臺東縣成功鎮至屏東縣滿州鄉沿岸',
        areaColor: '黃色',
        arrivalTime: '2025-07-30T13:19:00+08:00',
        waveHeight: '0.3至1公尺',
        infoStatus: 'predict'
      }
    ])
  })

  it('沒有資料（Tsunami 為空）回傳空陣列', () => {
    expect(normalizeTsunamiReports({ records: { Tsunami: [] } } as never)).toEqual([])
  })
})
