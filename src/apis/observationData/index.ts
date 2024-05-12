// 引入接口請求頭
import request from '@/utils/request'
// 引入ts類型
import type { nowWeatherData } from './type/nowWeather'
import type { autoStationWeatherData } from './type/autoStation'
import type { autoStationRainWeatherData } from './type/autoStationRain'
import type { dailyRainfallData } from './type/dailyRainfall'
// API
enum API {
  AUTHORIZATION_KEY = 'rdec-key-123-45678-011121314',
  MYAUTHORIZATION_KEY = 'CWA-5B4186CB-80E8-4CCF-82C5-1165862CA6E7',
  GETNOWOBSERVATIONDATA_URL = '/v1/rest/datastore/O-A0003-001?',
  GETAUTOSTATIONOBSERVATIONDATA_URL = '/v1/rest/datastore/O-A0001-001?',
  GETAUTOSTATIONRAINOBSERVATIONDATA_URL = '/v1/rest/datastore/O-A0002-001?',
  GETDAILYRAINFALLOBSERVATIONDATA_URL = '/v1/rest/datastore/C-B0025-001?'
}
// 獲取現在天氣觀測報告
export const getNowWeatherForecast = () =>
  request.get<any, nowWeatherData>(
    API.GETNOWOBSERVATIONDATA_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
// 獲取自動氣象站氣象觀測資料
export const getAutoStationWeatherForecast = () =>
  request.get<any, autoStationWeatherData>(
    API.GETAUTOSTATIONOBSERVATIONDATA_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
// 獲取自動氣象站雨量觀測資料
export const getAutoStationRainWeatherForecast = () =>
  request.get<any, autoStationRainWeatherData>(
    API.GETAUTOSTATIONRAINOBSERVATIONDATA_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
// 獲得每日雨量-地面測站每日雨量資料
export const getDailyRainfallObservationData = () =>
  request.get<any, dailyRainfallData>(
    API.GETDAILYRAINFALLOBSERVATIONDATA_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
