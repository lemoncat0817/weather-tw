// 引入接口請求頭
import request from '@/utils/request'
// 引入ts類型
import type { nowWeatherWarningData } from './type/nowWeatherWarning'
import type { weatherWarningContentData } from './type/weatherWarningContent'
// API
// 金鑰已由 Cloudflare Worker Proxy 統一附加（見 worker/README.md），
// 這裡只保留資料集路徑，不再帶 Authorization
enum API {
  GETNOWWEATHERWARNING_URL = '/v1/rest/datastore/W-C0033-001',
  GETWEATHERWARNINGCONTENT_URL = '/v1/rest/datastore/W-C0033-002'
}
// 獲取各別縣市地區目前之天氣警特報情形
export const getNowWeatherWarning = () =>
  request.get<any, nowWeatherWarningData>(API.GETNOWWEATHERWARNING_URL)
// 獲取各別天氣警特報之內容及所影響之區域
export const getWeatherWarningContent = () =>
  request.get<any, weatherWarningContentData>(API.GETWEATHERWARNINGCONTENT_URL)
