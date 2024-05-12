// 引入接口請求頭
import request from '@/utils/request'
// 引入ts類型
import type { nowWeatherWarningData } from './type/nowWeatherWarning'
import type { weatherWarningContentData } from './type/weatherWarningContent'
// API
enum API {
  AUTHORIZATION_KEY = 'rdec-key-123-45678-011121314',
  MYAUTHORIZATION_KEY = 'CWA-5B4186CB-80E8-4CCF-82C5-1165862CA6E7',
  GETNOWWEATHERWARNING_URL = '/v1/rest/datastore/W-C0033-001?',
  GETWEATHERWARNINGCONTENT_URL = '/v1/rest/datastore/W-C0033-002?'
}
// 獲取各別縣市地區目前之天氣警特報情形
export const getNowWeatherWarning = () =>
  request.get<any, nowWeatherWarningData>(
    API.GETNOWWEATHERWARNING_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
// 獲取各別天氣警特報之內容及所影響之區域
export const getWeatherWarningContent = () =>
  request.get<any, weatherWarningContentData>(
    API.GETWEATHERWARNINGCONTENT_URL + `Authorization=${API.MYAUTHORIZATION_KEY}`
  )
