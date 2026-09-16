import type {
  InundationSensor,
  InundationSeverity,
  InundationSummary
} from '#shared/types'

export interface RawInundationRecord {
  sensorid: string
  latestvalue: string
  timestamp: string
  areacode: string
  countycode: string
}

export const COUNTY_CODE_MAP: Record<string, string> = {
  '63000': '臺北市',
  '64000': '高雄市',
  '65000': '新北市',
  '66000': '臺中市',
  '67000': '臺南市',
  '68000': '桃園市',
  '10002': '宜蘭縣',
  '10004': '新竹縣',
  '10005': '苗栗縣',
  '10007': '彰化縣',
  '10008': '南投縣',
  '10009': '雲林縣',
  '10010': '嘉義縣',
  '10013': '屏東縣',
  '10014': '臺東縣',
  '10015': '花蓮縣',
  '10016': '澎湖縣',
  '10017': '基隆市',
  '10018': '新竹市',
  '10020': '嘉義市',
  '09020': '金門縣',
  '09007': '連江縣'
}

export function parseInundationSeverity(depthCm: number): InundationSeverity {
  if (depthCm <= 0) return 'none'
  if (depthCm >= 20) return 'critical'
  return 'warning'
}

// 感測器離線或故障時，水利署 API 會回填 999.9 這類哨兵值頂替最後一筆讀數（曾實測到一筆
// 水深 999.9、時間戳卻是 5 個月前的紀錄），不是真的量到 10 公尺深的水，視同無資料處理
const SENSOR_ERROR_SENTINEL_CM = 999

/**
 * 解析水利署路面淹水感測器最新資料（1b991bbb-ad85-4e7a-b931-06ce8749d3ed）
 */
export function normalizeInundationSensors(raw: RawInundationRecord[]): InundationSummary {
  if (!Array.isArray(raw)) {
    return {
      updatedAt: new Date().toISOString(),
      totalSensors: 0,
      activeInundationCount: 0,
      activeSensors: [],
      byCounty: []
    }
  }

  const countyStats: Record<string, { total: number; flooding: number }> = {}
  const activeSensors: InundationSensor[] = []

  // 初始化所有已知縣市統計
  for (const countyName of Object.values(COUNTY_CODE_MAP)) {
    countyStats[countyName] = { total: 0, flooding: 0 }
  }

  let latestTime = ''

  for (const item of raw) {
    const countyName = COUNTY_CODE_MAP[item.countycode] || '其他地區'
    if (!countyStats[countyName]) {
      countyStats[countyName] = { total: 0, flooding: 0 }
    }

    countyStats[countyName].total++

    const rawVal = Number.parseFloat(item.latestvalue)
    const depthCm =
      Number.isFinite(rawVal) && rawVal > 0 && rawVal < SENSOR_ERROR_SENTINEL_CM ? Math.round(rawVal * 10) / 10 : 0

    if (depthCm > 0) {
      countyStats[countyName].flooding++

      activeSensors.push({
        sensorId: item.sensorid,
        county: countyName,
        areaCode: item.areacode || '',
        countyCode: item.countycode || '',
        depthCm,
        severity: parseInundationSeverity(depthCm),
        observationTime: item.timestamp || ''
      })
    }

    if (item.timestamp && item.timestamp > latestTime) {
      latestTime = item.timestamp
    }
  }

  // 積水感測器依照水深由大到小排序
  activeSensors.sort((a, b) => b.depthCm - a.depthCm)

  const byCounty = Object.entries(countyStats)
    .map(([county, stat]) => ({
      county,
      total: stat.total,
      flooding: stat.flooding
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.flooding - a.flooding || b.total - a.total)

  return {
    updatedAt: latestTime || new Date().toISOString(),
    totalSensors: raw.length,
    activeInundationCount: activeSensors.length,
    activeSensors,
    byCounty
  }
}
