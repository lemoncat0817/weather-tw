import { describe, expect, it } from 'vitest'
import { normalizeThirtySixHour, normalizeTownExtended, normalizeTownHourly, normalizeTownSummaries } from '../forecast'

// 節錄自 F-C0032-001（今明 36 小時預報，縣市層級）：Wx/PoP/MinT/CI/MaxT 是各自獨立的
// weatherElement，靠陣列索引對齊回同一個時段，不是靠 startTime 比對
const THIRTY_SIX_HOUR_RAW = {
  records: {
    location: [
      {
        locationName: '臺北市',
        weatherElement: [
          {
            elementName: 'Wx',
            time: [
              {
                startTime: '2026-08-28 12:00:00',
                endTime: '2026-08-28 18:00:00',
                parameter: { parameterName: '多雲時晴', parameterValue: '2' }
              },
              {
                startTime: '2026-08-28 18:00:00',
                endTime: '2026-08-29 06:00:00',
                parameter: { parameterName: '晴時多雲', parameterValue: '1' }
              }
            ]
          },
          {
            // CWA 用 "-" 表示這個時段暫無降雨機率資料（不是省略該筆，陣列長度仍對齊）
            elementName: 'PoP',
            time: [
              { startTime: '2026-08-28 12:00:00', endTime: '2026-08-28 18:00:00', parameter: { parameterName: '30' } },
              { startTime: '2026-08-28 18:00:00', endTime: '2026-08-29 06:00:00', parameter: { parameterName: '-' } }
            ]
          },
          {
            elementName: 'MinT',
            time: [
              { startTime: '2026-08-28 12:00:00', endTime: '2026-08-28 18:00:00', parameter: { parameterName: '26' } },
              { startTime: '2026-08-28 18:00:00', endTime: '2026-08-29 06:00:00', parameter: { parameterName: '24' } }
            ]
          },
          {
            elementName: 'CI',
            time: [
              { startTime: '2026-08-28 12:00:00', endTime: '2026-08-28 18:00:00', parameter: { parameterName: '悶熱' } },
              { startTime: '2026-08-28 18:00:00', endTime: '2026-08-29 06:00:00', parameter: { parameterName: '舒適' } }
            ]
          },
          {
            elementName: 'MaxT',
            time: [
              { startTime: '2026-08-28 12:00:00', endTime: '2026-08-28 18:00:00', parameter: { parameterName: '33' } },
              { startTime: '2026-08-28 18:00:00', endTime: '2026-08-29 06:00:00', parameter: { parameterName: '27' } }
            ]
          }
        ]
      }
    ]
  }
}

describe('normalizeThirtySixHour', () => {
  it('依陣列索引把 Wx/PoP/MinT/CI/MaxT 五個獨立要素合併成同一組時段', () => {
    const [taipei] = normalizeThirtySixHour(THIRTY_SIX_HOUR_RAW as never)
    expect(taipei!.locationName).toBe('臺北市')
    expect(taipei!.periods[0]).toEqual({
      startTime: '2026-08-28 12:00:00',
      endTime: '2026-08-28 18:00:00',
      weather: '多雲時晴',
      weatherCode: '2',
      pop: 30,
      minTemperature: 26,
      maxTemperature: 33,
      comfortIndex: '悶熱'
    })
  })

  it('PoP 值是 "-"（CWA 表示暫無資料）時轉成 0，跟「整段完全沒有 PoP 資料」的 null 是兩回事', () => {
    const [taipei] = normalizeThirtySixHour(THIRTY_SIX_HOUR_RAW as never)
    expect(taipei!.periods[1]!.pop).toBe(0)
  })
})

// 節錄自 F-D0047-093（鄉鎮預報）：ElementValue 內的欄位名沒有統一慣例，多數要素靠
// Object.values 取第一個值即可，但「舒適度指數」跟「天氣現象」兩個要素本身就是複合值，
// 要靠固定的 key 名稱（ComfortIndex/ComfortIndexDescription、WeatherCode/Weather）取值
const TOWN_HOURLY_RAW = {
  records: {
    Locations: [
      {
        Location: [
          {
            LocationName: '中正區',
            Geocode: '6300100',
            Latitude: '25.0322',
            Longitude: '121.5186',
            WeatherElement: [
              { ElementName: '溫度', Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ Temperature: '31' }] }] },
              { ElementName: '露點溫度', Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ DewPoint: '24' }] }] },
              { ElementName: '相對濕度', Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ RelativeHumidity: '68' }] }] },
              {
                ElementName: '體感溫度',
                Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ ApparentTemperature: '35' }] }]
              },
              {
                ElementName: '舒適度指數',
                Time: [
                  {
                    DataTime: '2026-08-28T12:00:00+08:00',
                    ElementValue: [{ ComfortIndex: '31', ComfortIndexDescription: '悶熱' }]
                  }
                ]
              },
              { ElementName: '風速', Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ WindSpeed: '3' }] }] },
              { ElementName: '風向', Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ WindDirection: '東南風' }] }] },
              {
                ElementName: '3小時降雨機率',
                Time: [{ StartTime: '2026-08-28T12:00:00+08:00', EndTime: '2026-08-28T15:00:00+08:00', ElementValue: [{ ProbabilityOfPrecipitation: '20' }] }]
              },
              {
                ElementName: '天氣現象',
                Time: [
                  {
                    DataTime: '2026-08-28T12:00:00+08:00',
                    ElementValue: [{ Weather: '多雲', WeatherCode: '4', WeatherDescription: '多雲，降雨機率 20%' }]
                  }
                ]
              },
              {
                ElementName: '天氣預報綜合描述',
                Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ WeatherDescription: '多雲，降雨機率20%，溫度31度。' }] }]
              }
            ]
          }
        ]
      }
    ]
  }
}

describe('normalizeTownHourly', () => {
  it('取第一個 Location 的座標/Geocode，逐時各要素依索引對齊回一筆', () => {
    const town = normalizeTownHourly(TOWN_HOURLY_RAW as never, '臺北市')
    expect(town).toMatchObject({
      county: '臺北市',
      town: '中正區',
      geocode: '6300100',
      coordinates: { lat: 25.0322, lon: 121.5186 }
    })
    expect(town!.hourly[0]).toEqual({
      time: '2026-08-28T12:00:00+08:00',
      temperature: 31,
      dewPoint: 24,
      relativeHumidity: 68,
      apparentTemperature: 35,
      comfortIndex: 31,
      comfortDescription: '悶熱',
      windSpeed: 3,
      windDirection: '東南風',
      pop: 20,
      weatherCode: '4',
      weather: '多雲',
      description: '多雲，降雨機率20%，溫度31度。'
    })
  })

  it('records.Locations[0].Location 是空陣列（查無該鄉鎮）時回傳 null', () => {
    const empty = { records: { Locations: [{ Location: [] }] } }
    expect(normalizeTownHourly(empty as never, '臺北市')).toBeNull()
  })
})

// 節錄自 F-D0047-093 週版（偶數 dataset）：紫外線指數在夜間時段沒有資料，該筆 Time
// 完全不存在（不是值為空字串），toExtended 用 uv[i] 判斷存在與否，缺資料時回傳 null 而非 0
const TOWN_EXTENDED_RAW = {
  records: {
    Locations: [
      {
        Location: [
          {
            LocationName: '中正區',
            Geocode: '6300100',
            Latitude: '25.0322',
            Longitude: '121.5186',
            WeatherElement: [
              {
                ElementName: '平均溫度',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ Temperature: '29' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ Temperature: '27' }] }
                ]
              },
              {
                ElementName: '最高溫度',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ MaxTemperature: '33' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ MaxTemperature: '28' }] }
                ]
              },
              {
                ElementName: '最低溫度',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ MinTemperature: '26' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ MinTemperature: '25' }] }
                ]
              },
              {
                ElementName: '最高體感溫度',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ MaxApparentTemperature: '36' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ MaxApparentTemperature: '29' }] }
                ]
              },
              {
                ElementName: '最低體感溫度',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ MinApparentTemperature: '27' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ MinApparentTemperature: '25' }] }
                ]
              },
              {
                ElementName: '12小時降雨機率',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ ProbabilityOfPrecipitation: '30' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ ProbabilityOfPrecipitation: '10' }] }
                ]
              },
              {
                ElementName: '天氣現象',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ Weather: '多雲', WeatherCode: '4' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ Weather: '晴天', WeatherCode: '1' }] }
                ]
              },
              {
                // 只有白天時段有值，夜間那筆整個不存在
                ElementName: '紫外線指數',
                Time: [{ StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ UVIndex: '9' }] }]
              },
              {
                ElementName: '天氣預報綜合描述',
                Time: [
                  { StartTime: '2026-08-28T06:00:00+08:00', EndTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ WeatherDescription: '白天多雲，紫外線指數9，危險級。' }] },
                  { StartTime: '2026-08-28T18:00:00+08:00', EndTime: '2026-08-29T00:00:00+08:00', ElementValue: [{ WeatherDescription: '晚上晴朗。' }] }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

describe('normalizeTownExtended', () => {
  it('白天時段的紫外線指數正常轉成數字', () => {
    const [day] = normalizeTownExtended(TOWN_EXTENDED_RAW as never)
    expect(day!.uvIndex).toBe(9)
  })

  it('夜間時段沒有紫外線指數資料（該筆 Time 不存在）回傳 null，不是 0', () => {
    const [, night] = normalizeTownExtended(TOWN_EXTENDED_RAW as never)
    expect(night!.uvIndex).toBeNull()
    expect(night).toMatchObject({
      startTime: '2026-08-28T18:00:00+08:00',
      endTime: '2026-08-29T00:00:00+08:00',
      avgTemperature: 27,
      maxTemperature: 28,
      minTemperature: 25,
      weather: '晴天',
      weatherCode: '1'
    })
  })
})

describe('normalizeTownSummaries', () => {
  it('查詢時沒帶 LocationName，CWA 回傳整個縣市的所有鄉鎮，每個鄉鎮只取第一筆（最近）資料', () => {
    const raw = {
      records: {
        Locations: [
          {
            Location: [
              {
                LocationName: '中正區',
                Geocode: '6300100',
                Latitude: '25.0322',
                Longitude: '121.5186',
                WeatherElement: [
                  { ElementName: '溫度', Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ Temperature: '31' }] }] },
                  {
                    ElementName: '3小時降雨機率',
                    Time: [{ StartTime: '2026-08-28T12:00:00+08:00', EndTime: '2026-08-28T15:00:00+08:00', ElementValue: [{ ProbabilityOfPrecipitation: '20' }] }]
                  },
                  {
                    ElementName: '天氣現象',
                    Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ Weather: '多雲', WeatherCode: '4' }] }]
                  }
                ]
              },
              {
                LocationName: '大安區',
                Geocode: '6300200',
                Latitude: '25.0265',
                Longitude: '121.5436',
                WeatherElement: [
                  { ElementName: '溫度', Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ Temperature: '32' }] }] },
                  {
                    ElementName: '3小時降雨機率',
                    Time: [{ StartTime: '2026-08-28T12:00:00+08:00', EndTime: '2026-08-28T15:00:00+08:00', ElementValue: [{ ProbabilityOfPrecipitation: '10' }] }]
                  },
                  {
                    ElementName: '天氣現象',
                    Time: [{ DataTime: '2026-08-28T12:00:00+08:00', ElementValue: [{ Weather: '晴天', WeatherCode: '1' }] }]
                  }
                ]
              }
            ]
          }
        ]
      }
    }

    const summaries = normalizeTownSummaries(raw as never, '臺北市')
    expect(summaries).toHaveLength(2)
    expect(summaries).toEqual([
      {
        county: '臺北市',
        town: '中正區',
        coordinates: { lat: 25.0322, lon: 121.5186 },
        temperature: 31,
        weatherCode: '4',
        weather: '多雲',
        pop: 20
      },
      {
        county: '臺北市',
        town: '大安區',
        coordinates: { lat: 25.0265, lon: 121.5436 },
        temperature: 32,
        weatherCode: '1',
        weather: '晴天',
        pop: 10
      }
    ])
  })
})
