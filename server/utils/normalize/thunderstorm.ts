import type {
  InstantAlertItem,
  InstantAlertsResponse,
  InstantAlertSeverity,
  InstantAlertType
} from '#shared/types'

export function parseCwaDateTimeToIso(dtStr: string | undefined): string | undefined {
  if (!dtStr) return undefined
  // dtStr: "2026/09/16 10:33" or "2026-09-16 10:33:00"
  const m = dtStr.match(/(\d{4})[/-](\d{2})[/-](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return dtStr
  const [, y, mon, d, h, min, sec] = m
  return `${y}-${mon}-${d}T${h}:${min}:${sec || '00'}+08:00`
}

export function determineInstantSeverity(type: InstantAlertType, title: string): InstantAlertSeverity {
  if (type === 'thunderstorm') return 'warning'
  if (title.includes('大雷雨') || title.includes('豪雨') || title.includes('冰雹')) return 'warning'
  if (title.includes('強風') || title.includes('長浪')) return 'watch'
  return 'minor'
}

/**
 * 解析 CWA 官網 Warning_Content.js 中的大雷雨即時訊息與即時天氣提醒。
 */
export function normalizeThunderstormAndInstantAlerts(jsContent: string): InstantAlertsResponse {
  const alerts: InstantAlertItem[] = []

  // 1. 擷取 WarnContent 物件內容
  // 透過正則搜尋 'title': '...', 'issued': '...', 'content': '...'
  const itemBlockRegex = /['"]title['"]\s*:\s*['"]([^'"]+)['"][\s\S]*?['"]issued['"]\s*:\s*['"]([^'"]+)['"](?:[\s\S]*?['"]validto['"]\s*:\s*['"]([^'"]+)['"])?[\s\S]*?['"]content['"]\s*:\s*['"]([\s\S]*?)['"],/g
  let blockMatch: RegExpExecArray | null

  while ((blockMatch = itemBlockRegex.exec(jsContent)) !== null) {
    const title = blockMatch[1]
    const issuedRaw = blockMatch[2]
    const validRaw = blockMatch[3]
    const rawContent = blockMatch[4]
    if (!title || !issuedRaw || !rawContent) continue

    // 過濾純英文警訊，避免與中文版重複（CWA JS 會同時包含 'C' 與 'E' 物件）
    if (!/[\u4e00-\u9fa5]/.test(title)) continue

    const issuedTime = parseCwaDateTimeToIso(issuedRaw) || new Date().toISOString()
    const validUntil = validRaw ? parseCwaDateTimeToIso(validRaw) : undefined
    const content = rawContent.replace(/\\n/g, '\n').trim()

    let type: InstantAlertType = 'other'
    if (title.includes('大雷雨')) {
      type = 'thunderstorm'
    } else if (title.includes('即時天氣')) {
      type = 'instant_weather'
    } else if (title.includes('風')) {
      type = 'wind'
    } else if (title.includes('浪')) {
      type = 'surf'
    }

    const affectedAreas: string[] = []
    const counties = [
      '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
      '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '臺南市',
      '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'
    ]
    for (const c of counties) {
      if (content.includes(c) || content.includes(c.replace(/臺/g, '台'))) {
        affectedAreas.push(c)
      }
    }

    alerts.push({
      id: `alert-${issuedRaw.replace(/\D/g, '')}-${alerts.length}`,
      type,
      title,
      issuedTime,
      validUntil,
      content,
      affectedAreas,
      severity: determineInstantSeverity(type, title)
    })
  }

  // 2. 擷取 WarnContent_W33（大雷雨即時訊息）
  const w33BlockMatch = jsContent.match(/var\s+WarnContent_W33\s*=\s*(\[[\s\S]*?\]);/)
  const w33Body = w33BlockMatch?.[1]
  if (w33Body && w33Body.trim() !== '[]') {
    try {
      // 嘗試逐個物件正則解析
      const w33ItemRegex = /\{[\s\S]*?['"]title['"]\s*:\s*['"]([^'"]+)['"][\s\S]*?['"]issued['"]\s*:\s*['"]([^'"]+)['"](?:[\s\S]*?['"]validto['"]\s*:\s*['"]([^'"]+)['"])?[\s\S]*?['"]content['"]\s*:\s*['"]([\s\S]*?)['"][\s\S]*?\}/g
      let wMatch: RegExpExecArray | null
      while ((wMatch = w33ItemRegex.exec(w33Body)) !== null) {
        const title = wMatch[1]
        const issued = wMatch[2]
        const validto = wMatch[3]
        const rawW33Content = wMatch[4]
        if (!title || !issued || !rawW33Content) continue

        const content = rawW33Content.replace(/\\n/g, '\n').trim()

        const affectedAreas: string[] = []
        const counties = [
          '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
          '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '臺南市',
          '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'
        ]
        for (const c of counties) {
          if (content.includes(c) || content.includes(c.replace(/臺/g, '台')) || w33Body.includes(c)) {
            affectedAreas.push(c)
          }
        }

        alerts.unshift({
          id: `W33-${issued.replace(/\D/g, '')}`,
          type: 'thunderstorm',
          title,
          issuedTime: parseCwaDateTimeToIso(issued) || new Date().toISOString(),
          validUntil: validto ? parseCwaDateTimeToIso(validto) : undefined,
          content,
          affectedAreas: [...new Set(affectedAreas)],
          severity: 'warning'
        })
      }
    } catch {
      // 容錯
    }
  }

  alerts.sort((a, b) => (a.issuedTime < b.issuedTime ? 1 : a.issuedTime > b.issuedTime ? -1 : 0))

  return {
    updatedAt: new Date().toISOString(),
    alerts
  }
}
