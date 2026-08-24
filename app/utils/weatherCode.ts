// 中央氣象署「預報產品天氣描述代碼表」（1~42），完整表格見：
// https://www.cwa.gov.tw/V8/assets/pdf/Weather_Icon.pdf
// 官方表格本身把數百種天氣描述文字收斂成 42 個分類代碼（同一代碼可能對應多種描述文字），
// 這裡再進一步把 42 個代碼收斂成 12 組「圖示語意」，供 WeatherIcon.vue 選圖用——
// 42 個各自獨立的圖示對 meteogram 這種小尺寸顯示場景沒有實益，反而不利辨識。
// [註] 官方表格規則：含「晴」的分類，白天用太陽、晚上用月亮；其餘（純雲/雨/雷/霧/雪）不分日夜。

export type WeatherIconKey =
  | 'clear'
  | 'mostly-clear'
  | 'partly-cloudy'
  | 'mostly-cloudy'
  | 'cloudy'
  | 'light-rain'
  | 'rain'
  | 'thunderstorm'
  | 'sleet'
  | 'fog'
  | 'fog-rain'
  | 'snow'

/** 含「晴」的分類代碼，這幾組才需要日夜圖示切換 */
const DAYTIME_SENSITIVE: ReadonlySet<WeatherIconKey> = new Set(['clear', 'mostly-clear', 'partly-cloudy'])

const CODE_TO_ICON: Record<string, WeatherIconKey> = {
  '1': 'clear',
  '2': 'mostly-clear',
  '3': 'mostly-clear',
  '4': 'partly-cloudy',
  '5': 'mostly-cloudy',
  '6': 'mostly-cloudy',
  '7': 'cloudy',
  '8': 'light-rain',
  '9': 'light-rain',
  '10': 'light-rain',
  '11': 'light-rain',
  '12': 'rain',
  '13': 'rain',
  '14': 'rain',
  '15': 'thunderstorm',
  '16': 'thunderstorm',
  '17': 'thunderstorm',
  '18': 'thunderstorm',
  '19': 'light-rain',
  '20': 'light-rain',
  '21': 'thunderstorm',
  '22': 'thunderstorm',
  '23': 'sleet',
  '24': 'fog',
  '25': 'fog',
  '26': 'fog',
  '27': 'fog',
  '28': 'fog',
  '29': 'light-rain',
  '30': 'light-rain',
  '31': 'fog-rain',
  '32': 'fog-rain',
  '33': 'thunderstorm',
  '34': 'thunderstorm',
  '35': 'fog-rain',
  '36': 'fog-rain',
  '37': 'sleet',
  '38': 'fog-rain',
  '39': 'fog-rain',
  '41': 'fog-rain',
  '42': 'snow'
}

/**
 * CWA 天氣代碼 → 圖示語意 key。code 未知時退回 'cloudy'（比顯示破圖安全）。
 * 日／夜由 isDaytimeSensitive() + WeatherIcon.vue 另外處理，這裡的 key 本身不分日夜。
 */
export function weatherIconKey(code: string): WeatherIconKey {
  return CODE_TO_ICON[code] ?? 'cloudy'
}

export function isDaytimeSensitive(key: WeatherIconKey): boolean {
  return DAYTIME_SENSITIVE.has(key)
}

/** 依小時判斷白天／晚上（06:00–17:59 視為白天，跟 utils/time.ts 的既有慣例一致） */
export function isDaytimeHour(date: Date): boolean {
  const h = date.getHours()
  return h >= 6 && h < 18
}
