// A-B0062-001：全臺各縣市每天的日出、日沒時刻

interface CwaSunTime {
  Date: string
  SunRiseTime: string
  SunSetTime: string
}
interface CwaSunLocation {
  CountyName: string
  time: CwaSunTime[]
}
interface CwaSunResponse {
  records: { locations: { location: CwaSunLocation[] } }
}

/**
 * SunRiseTime/SunSetTime 只有 "HH:MM"，沒有日期也沒有時區——這組資料本來就是台北當地時間，
 * CWA 只是省略掉日期/時區沒有明講，要跟查詢用的 Date 組合後補上 +08:00。
 */
function toTaipeiIso(date: string, hhmm: string): string {
  return `${date}T${hhmm}:00+08:00`
}

/** 呼叫端需帶 CountyName + Date 篩選只剩一筆；找不到（例如日期超出資料涵蓋範圍）回傳 null */
export function normalizeSunTimes(raw: CwaSunResponse): { sunrise: string; sunset: string } | null {
  const t = raw.records.locations.location[0]?.time[0]
  if (!t) return null
  return { sunrise: toTaipeiIso(t.Date, t.SunRiseTime), sunset: toTaipeiIso(t.Date, t.SunSetTime) }
}
