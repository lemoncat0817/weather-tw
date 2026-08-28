import { describe, expect, it } from 'vitest'
import { normalizeRainStation, normalizeWeatherStation } from '../observation'

// 節錄自 O-A0003-001 實際回應（基隆站），保留完整的 GustInfo / DailyExtreme 巢狀結構
const WEATHER_STATION_RAW = {
  StationName: '基隆',
  StationId: '466940',
  ObsTime: { DateTime: '2026-08-28T11:50:00+08:00' },
  GeoInfo: {
    Coordinates: [
      { CoordinateName: 'TWD67', StationLatitude: '25.135104', StationLongitude: '121.732242' },
      { CoordinateName: 'WGS84', StationLatitude: '25.133314', StationLongitude: '121.740475' }
    ],
    StationAltitude: '26.7',
    CountyName: '基隆市',
    TownName: '仁愛區',
    CountyCode: '10017',
    TownCode: '10017040'
  },
  WeatherElement: {
    Weather: '陰',
    VisibilityDescription: '>30',
    SunshineDuration: '2.2',
    Now: { Precipitation: '0.0' },
    WindDirection: '190.0',
    WindSpeed: '1.7',
    AirTemperature: '33.8',
    RelativeHumidity: '56',
    AirPressure: '995.9',
    UVIndex: '8',
    GustInfo: {
      PeakGustSpeed: '7.4',
      Occurred_at: { WindDirection: '250.0', DateTime: '2026-08-28T10:09:00+08:00' }
    },
    DailyExtreme: {
      DailyHigh: { TemperatureInfo: { AirTemperature: '34.3', Occurred_at: { DateTime: '2026-08-28T11:46:00+08:00' } } },
      DailyLow: { TemperatureInfo: { AirTemperature: '28.9', Occurred_at: { DateTime: '2026-08-28T05:29:00+08:00' } } }
    }
  }
}

// 節錄自 O-A0002-001 實際回應（九份二山站）——注意 Past6Hr 是大寫 H，其餘皆小寫 hr，
// 這是 CWA 原始資料本身的不一致，不是筆誤
const RAIN_STATION_RAW = {
  StationName: '九份二山',
  StationId: 'C1I230',
  ObsTime: { DateTime: '2026-08-28T11:50:00+08:00' },
  GeoInfo: {
    Coordinates: [{ CoordinateName: 'WGS84', StationLatitude: '23.962025', StationLongitude: '120.845272' }],
    StationAltitude: '837.0',
    CountyName: '南投縣',
    TownName: '國姓鄉',
    CountyCode: '10008',
    TownCode: '10008100'
  },
  RainfallElement: {
    Now: { Precipitation: '11.5' },
    Past10Min: { Precipitation: '0.0' },
    Past1hr: { Precipitation: '9.0' },
    Past3hr: { Precipitation: '10.5' },
    Past6Hr: { Precipitation: '11.5' },
    Past12hr: { Precipitation: '11.5' },
    Past24hr: { Precipitation: '17.0' },
    Past2days: { Precipitation: '33.5' },
    Past3days: { Precipitation: '85.5' }
  }
}

describe('normalizeWeatherStation', () => {
  it('讀出陣風（GustInfo）與現在風速是兩個不同欄位', () => {
    const s = normalizeWeatherStation(WEATHER_STATION_RAW as never)
    expect(s.reading.windSpeed).toBe(1.7)
    expect(s.reading.peakGust).toEqual({ speed: 7.4, direction: 250, time: '2026-08-28T10:09:00+08:00' })
  })

  it('讀出當日最高/最低溫及發生時刻（DailyExtreme）', () => {
    const s = normalizeWeatherStation(WEATHER_STATION_RAW as never)
    expect(s.reading.dailyExtreme).toEqual({
      highTemperature: 34.3,
      highTime: '2026-08-28T11:46:00+08:00',
      lowTemperature: 28.9,
      lowTime: '2026-08-28T05:29:00+08:00'
    })
  })

  it('讀出天氣現象文字、能見度、日照時數', () => {
    const s = normalizeWeatherStation(WEATHER_STATION_RAW as never)
    expect(s.reading.weatherDescription).toBe('陰')
    expect(s.reading.visibility).toBe('>30')
    expect(s.reading.sunshineDuration).toBe(2.2)
  })

  it('讀出測站海拔與行政區代碼', () => {
    const s = normalizeWeatherStation(WEATHER_STATION_RAW as never)
    expect(s.altitude).toBe(26.7)
    expect(s.countyCode).toBe('10017')
    expect(s.townCode).toBe('10017040')
  })

  it('氣象站沒有累積雨量時距欄位，precipitationAccumulation 為 null', () => {
    const s = normalizeWeatherStation(WEATHER_STATION_RAW as never)
    expect(s.reading.precipitationAccumulation).toBeNull()
  })

  it('沒有 GustInfo/DailyExtreme 的測站回傳 null，不是欄位缺失的空物件', () => {
    const minimal = { ...WEATHER_STATION_RAW, WeatherElement: { AirTemperature: '20.0' } }
    const s = normalizeWeatherStation(minimal as never)
    expect(s.reading.peakGust).toBeNull()
    expect(s.reading.dailyExtreme).toBeNull()
  })
})

describe('normalizeRainStation', () => {
  it('八個累積雨量時距全部讀出，包含大小寫不一致的 Past6Hr', () => {
    const s = normalizeRainStation(RAIN_STATION_RAW as never)
    expect(s.reading.precipitationAccumulation).toEqual({
      past10min: 0,
      past1hr: 9,
      past3hr: 10.5,
      past6hr: 11.5, // 來自 Past6Hr（大寫 H），不是 Past6hr
      past12hr: 11.5,
      past24hr: 17,
      past2days: 33.5,
      past3days: 85.5
    })
  })

  it('讀出測站海拔與行政區代碼', () => {
    const s = normalizeRainStation(RAIN_STATION_RAW as never)
    expect(s.altitude).toBe(837)
    expect(s.countyCode).toBe('10008')
    expect(s.townCode).toBe('10008100')
  })

  it('雨量站沒有氣溫/陣風等氣象站專屬欄位，全部回傳 null', () => {
    const s = normalizeRainStation(RAIN_STATION_RAW as never)
    expect(s.reading.temperature).toBeNull()
    expect(s.reading.peakGust).toBeNull()
    expect(s.reading.dailyExtreme).toBeNull()
    expect(s.reading.weatherDescription).toBeNull()
  })
})
