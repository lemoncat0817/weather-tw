import { describe, expect, it } from 'vitest'
import { normalizeEarthquakes } from '../earthquake'

// 精簡自實測回應（E-A0015-001，2026-08-25 臺東外海地震）：ShakingArea 陣列刻意保留
// CWA 真實的「明細列＋彙總列」混雜結構，用來鎖住 normalizeOne 的去重邏輯。
const RAW = {
  records: {
    Earthquake: [
      {
        EarthquakeNo: 115057,
        ReportContent: '08/25-15:00臺灣東南部海域發生規模5.8有感地震，最大震度臺東縣綠島4級。',
        ReportColor: '黃色',
        ShakemapImageURI: 'https://example.com/shakemap.png',
        EarthquakeInfo: {
          OriginTime: '2026-08-25T15:00:11+08:00',
          FocalDepth: 13.1,
          Epicenter: { Location: '臺東縣政府東南東方 48.0 公里', EpicenterLatitude: 22.63, EpicenterLongitude: 121.6 },
          EarthquakeMagnitude: { MagnitudeType: '芮氏規模', MagnitudeValue: 5.8 }
        },
        Intensity: {
          ShakingArea: [
            // 明細列：每個縣市各一筆
            { AreaDesc: '臺東縣地區', CountyName: '臺東縣', AreaIntensity: '4級' },
            { AreaDesc: '花蓮縣地區', CountyName: '花蓮縣', AreaIntensity: '3級' },
            { AreaDesc: '嘉義縣地區', CountyName: '嘉義縣', AreaIntensity: '3級' },
            { AreaDesc: '屏東縣地區', CountyName: '屏東縣', AreaIntensity: '2級' },
            // 彙總列：CountyName 是用「、」串起來的清單，AreaDesc 是「最大震度X級地區」——
            // 這幾筆不該出現在 normalize 後的 shakingAreas
            { AreaDesc: '最大震度4級地區', CountyName: '臺東縣', AreaIntensity: '4級' },
            { AreaDesc: '最大震度3級地區', CountyName: '花蓮縣、嘉義縣', AreaIntensity: '3級' },
            { AreaDesc: '最大震度2級地區', CountyName: '屏東縣', AreaIntensity: '2級' }
          ]
        }
      }
    ]
  }
}

describe('normalizeEarthquakes', () => {
  it('過濾掉 CWA 的彙總列（CountyName 含「、」），只保留每縣市一筆的明細列', () => {
    const [eq] = normalizeEarthquakes(RAW as never)

    expect(eq!.shakingAreas).toHaveLength(4)
    expect(eq!.shakingAreas.map((a) => a.county)).toEqual(['臺東縣', '花蓮縣', '嘉義縣', '屏東縣'])
    // 彙總列的「、」清單字串不該出現在任何一筆的 county 欄位
    expect(eq!.shakingAreas.some((a) => a.county.includes('、'))).toBe(false)
  })

  it('maxIntensity 仍取全部（含彙總列）中震度最高的一筆，不受過濾影響', () => {
    const [eq] = normalizeEarthquakes(RAW as never)
    expect(eq!.maxIntensity).toBe('4級')
  })

  it('其餘欄位正確對應 CWA 原始結構', () => {
    const [eq] = normalizeEarthquakes(RAW as never)
    expect(eq).toMatchObject({
      id: '115057',
      magnitude: 5.8,
      magnitudeType: '芮氏規模',
      depthKm: 13.1,
      epicenter: { lat: 22.63, lon: 121.6 }
    })
  })
})

// 節錄自 E-A0016-001 實際回應（屏東縣滿州地震）：第二筆測站（池上／ECS 這類舊站）
// 刻意省略 pga/pgv，只有 SeismicIntensity——測站級資料裡這是常態，不是缺陷
const RAW_WITH_STATIONS = {
  records: {
    Earthquake: [
      {
        EarthquakeNo: 115000,
        ReportContent: '08/28-10:20臺灣西南部海域發生規模4.4有感地震，最大震度屏東縣滿州2級。',
        ReportColor: '綠色',
        EarthquakeInfo: {
          OriginTime: '2026-08-28T10:20:56+08:00',
          FocalDepth: 50.7,
          Epicenter: { Location: '高雄市政府南方 66.3 公里', EpicenterLatitude: 22.03, EpicenterLongitude: 120.38 },
          EarthquakeMagnitude: { MagnitudeType: '芮氏規模', MagnitudeValue: 4.4 }
        },
        Intensity: {
          ShakingArea: [
            {
              AreaDesc: '屏東縣地區',
              CountyName: '屏東縣',
              AreaIntensity: '2級',
              EqStation: [
                {
                  pga: { unit: 'gal', EWComponent: 3.05, NSComponent: 2.38, VComponent: 1.69, IntScaleValue: 3.26 },
                  pgv: { unit: 'kine', IntScaleValue: 0.14 },
                  StationName: '滿州',
                  StationID: 'SMS',
                  EpicenterDistance: 46.7,
                  SeismicIntensity: '2級',
                  StationLatitude: 22.021,
                  StationLongitude: 120.837
                },
                {
                  // 無 pga/pgv 的測站（實測存在，不是每個測站都有強震儀資料）
                  StationName: '池上',
                  StationID: 'ECS',
                  EpicenterDistance: 33.59,
                  SeismicIntensity: '1級',
                  StationLatitude: 23.095,
                  StationLongitude: 121.24
                }
              ]
            },
            // 彙總列：EqStation 恆為空陣列，不該貢獻任何測站
            { AreaDesc: '最大震度2級地區', CountyName: '屏東縣', AreaIntensity: '2級', EqStation: [] }
          ]
        }
      }
    ]
  }
}

describe('normalizeEarthquakes — 測站級資料（stations）', () => {
  it('攤平所有明細列的 EqStation，彙總列的空陣列不貢獻任何測站', () => {
    const [eq] = normalizeEarthquakes(RAW_WITH_STATIONS as never)
    expect(eq!.stations).toHaveLength(2)
    expect(eq!.stations.map((s) => s.stationId)).toEqual(['SMS', 'ECS'])
  })

  it('有 pga/pgv 的測站正確讀出 IntScaleValue', () => {
    const [eq] = normalizeEarthquakes(RAW_WITH_STATIONS as never)
    const manzhou = eq!.stations.find((s) => s.stationId === 'SMS')
    expect(manzhou).toMatchObject({ pga: 3.26, pgv: 0.14, seismicIntensity: '2級', epicenterDistance: 46.7 })
  })

  it('沒有 pga/pgv 的測站回傳 null，不是拋例外或 undefined', () => {
    const [eq] = normalizeEarthquakes(RAW_WITH_STATIONS as never)
    const chishang = eq!.stations.find((s) => s.stationId === 'ECS')
    expect(chishang).toMatchObject({ pga: null, pgv: null, seismicIntensity: '1級' })
  })
})
