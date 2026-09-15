import { describe, expect, it } from 'vitest'
import { normalizeAirQualityStations } from '../airQuality'

// 節錄自 AQX_P_432 實際回應（2026-09-15 16:00 發布）。回應本身最外層就是陣列，不是包一層
// {records:[...]}——這點官方 API 使用手冊的範例截圖用的是另一支資料集（AQX_P_488），
// 兩者實測並不一致。
const RAW = [
  {
    sitename: '汐止',
    county: '新北市',
    aqi: '61',
    pollutant: '細懸浮微粒',
    status: '普通',
    so2: '0.8',
    co: '0.24',
    o3: '49',
    o3_8hr: '46',
    pm10: '47',
    'pm2.5': '20',
    no2: '6',
    nox: '7.1',
    no: '0.7',
    wind_speed: '2.2',
    wind_direc: '37',
    publishtime: '2026/09/15 16:00:00',
    co_8hr: '0.2',
    'pm2.5_avg': '16',
    pm10_avg: '38',
    so2_avg: '0',
    longitude: '121.64081',
    latitude: '25.06624',
    siteid: '2'
  },
  {
    sitename: '湖口',
    county: '新竹縣',
    aqi: '50',
    pollutant: '',
    status: '良好',
    so2: '0.4',
    co: '0.24',
    o3: '50',
    o3_8hr: '50',
    pm10: '33',
    'pm2.5': '15',
    no2: '5',
    nox: '7.4',
    no: '1.5',
    wind_speed: '6',
    wind_direc: '50',
    publishtime: '2026/09/15 16:00:00',
    co_8hr: '0.2',
    'pm2.5_avg': '12',
    pm10_avg: '30',
    so2_avg: '0',
    longitude: '121.03887',
    latitude: '24.900097',
    siteid: '22'
  },
  {
    // 節錄自實測：單一污染物讀值可以是空字串，即使 AQI 本身有值（二林站，PM2.5 缺值）
    sitename: '二林',
    county: '彰化縣',
    aqi: '77',
    pollutant: '懸浮微粒',
    status: '普通',
    so2: '0.9',
    co: '0.28',
    o3: '60',
    o3_8hr: '49',
    pm10: '60',
    'pm2.5': '',
    no2: '4',
    nox: '5.2',
    no: '0.8',
    wind_speed: '4',
    wind_direc: '21',
    publishtime: '2026/09/15 16:00:00',
    co_8hr: '0.2',
    'pm2.5_avg': '18.3',
    pm10_avg: '54',
    so2_avg: '0',
    longitude: '120.40965',
    latitude: '23.925175',
    siteid: '35'
  }
]

describe('normalizeAirQualityStations', () => {
  it('讀出座標（AQX_P_432 本身就帶 longitude/latitude，不需要另外 join 測站資料集）', () => {
    const [xizhi] = normalizeAirQualityStations(RAW as never)
    expect(xizhi!.coordinates).toEqual({ lat: 25.06624, lon: 121.64081 })
  })

  it('把官方狀態字串對應到分類等級', () => {
    const stations = normalizeAirQualityStations(RAW as never)
    expect(stations.map((s) => s.level)).toEqual(['moderate', 'good', 'moderate'])
  })

  it('無首要污染物（狀態良好）時 majorPollutant 為 null，不是空字串', () => {
    const huko = normalizeAirQualityStations(RAW as never).find((s) => s.siteName === '湖口')
    expect(huko!.majorPollutant).toBeNull()
  })

  it('單一污染物讀值為空字串時該欄位回傳 null，不影響其餘欄位', () => {
    const erlin = normalizeAirQualityStations(RAW as never).find((s) => s.siteName === '二林')
    expect(erlin).toMatchObject({ aqi: 77, pm25: null, pm10: 60 })
  })

  it('把用斜線分隔、沒帶時區的 publishtime 轉成明確帶 +08:00 的 ISO 字串', () => {
    const [xizhi] = normalizeAirQualityStations(RAW as never)
    expect(xizhi!.publishTime).toBe('2026-09-15T16:00:00+08:00')
    expect(new Date(xizhi!.publishTime).toISOString()).toBe('2026-09-15T08:00:00.000Z')
  })
})
