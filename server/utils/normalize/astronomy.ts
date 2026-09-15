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

// ---------------------------------------------------------------------------
// A-B0063-001：全臺各縣市每天的月出、月沒時刻
// ---------------------------------------------------------------------------

interface CwaMoonTime {
  Date: string
  MoonRiseTime: string
  MoonSetTime: string
}
interface CwaMoonLocation {
  CountyName: string
  time: CwaMoonTime[]
}
interface CwaMoonResponse {
  records: { locations: { location: CwaMoonLocation[] } }
}

/** 跟日出日沒不同，月出/月沒每個月各有一天會缺席（月球公轉週期不是整數天）——CWA 用空字串
 *  表示「該日無此現象」，這裡照實回傳 null，不是抓取失敗，呼叫端要能分辨兩者。 */
function toTaipeiIsoOrNull(date: string, hhmm: string): string | null {
  return hhmm ? `${date}T${hhmm}:00+08:00` : null
}

/** 呼叫端需帶 CountyName + Date 篩選只剩一筆；找不到（例如日期超出資料涵蓋範圍）回傳 null */
export function normalizeMoonTimes(raw: CwaMoonResponse): { moonrise: string | null; moonset: string | null } | null {
  const t = raw.records.locations.location[0]?.time[0]
  if (!t) return null
  return { moonrise: toTaipeiIsoOrNull(t.Date, t.MoonRiseTime), moonset: toTaipeiIsoOrNull(t.Date, t.MoonSetTime) }
}
