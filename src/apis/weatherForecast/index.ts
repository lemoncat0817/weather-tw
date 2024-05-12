// 引入接口請求頭
import request from '@/utils/request'
// 引入ts類型
import type { thirtySixHoursWeatherData } from './type/thirtySixHours'
import type { threeDaysWeatherData } from './type/threeDays'
import type { weekWeatherData } from './type/week'
import type { allTaiwanWeatherData } from './type/allTaiwan'
import type { allTaiwanWeekWeatherData } from './type/allTaiwanWeek'
// API
enum API {
  AUTHORIZATION_KEY = 'rdec-key-123-45678-011121314',
  MYAUTHORIZATION_KEY = 'CWA-5B4186CB-80E8-4CCF-82C5-1165862CA6E7',
  GETTHIRTYSIXHOURSWEATHERFORECAST_URL = '/v1/rest/datastore/F-C0032-001?',
  GETTHREEDAYSWEATHERFORECAST_URL = '/v1/rest/datastore/F-D0047-089?',
  GETWEEKWEATHERFORECAST_URL = '/v1/rest/datastore/F-D0047-091?',
  GETALLTAIWANWEATHERFORECAST_URL = '/v1/rest/datastore/F-D0047-093?',
  GETALLTAIWANWEEKWEATHERFORECAST_URL = '/v1/rest/datastore/'
}
// 獲取36小時天氣數據
export const getThirtySixHoursWeatherForecast = () =>
  request.get<any, thirtySixHoursWeatherData>(
    API.GETTHIRTYSIXHOURSWEATHERFORECAST_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
// 獲取未來三天氣數據
export const getThreeDaysWeatherForecast = () =>
  request.get<any, threeDaysWeatherData>(
    API.GETTHREEDAYSWEATHERFORECAST_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
// 獲取未來一周天氣數據
export const getWeekWeatherForecast = () =>
  request.get<any, weekWeatherData>(
    API.GETWEEKWEATHERFORECAST_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
// 獲取全臺灣各鄉鎮市區預報資料
export const getAllTaiwanWeatherForecast = (locationId: string) =>
  request.get<any, allTaiwanWeatherData>(
    API.GETALLTAIWANWEATHERFORECAST_URL +
      `Authorization=${API.MYAUTHORIZATION_KEY}&locationId=${locationId}`
  )
// 獲取全臺灣各鄉鎮市區一週預報資料
export const getAllTaiwanWeekWeatherForecast = (locationId: string) =>
  request.get<any, allTaiwanWeekWeatherData>(
    API.GETALLTAIWANWEEKWEATHERFORECAST_URL +
      `${locationId}?Authorization=${API.MYAUTHORIZATION_KEY}`
  )
