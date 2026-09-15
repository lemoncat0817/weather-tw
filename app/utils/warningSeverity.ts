// CWA 的 significance 欄位（特報/警報/注意）不足以單獨反映實際危害程度——同樣是「特報」，
// 豪雨特報跟濃霧特報的嚴重程度天差地遠。這裡用 phenomena（現象名稱）本身的關鍵字概略分級，
// 對應 app/assets/css/main.css 定義的 --color-severity-* 四階（跟圖表用的 STATUS 色階分開，
// 這組是 UI 層級、專門對應 CWA 特報分級慣例的色票）。首頁警特報條跟 /warnings 頁共用同一份判斷，
// 避免兩處各寫一次、日後改一邊漏一邊。
export function severityClass(phenomena: string): string {
  if (phenomena.includes('豪雨') || phenomena.includes('颱風')) return 'bg-severity-warning/15 text-severity-warning'
  if (phenomena.includes('大雨') || phenomena.includes('低溫')) return 'bg-severity-watch/15 text-severity-watch'
  return 'bg-severity-advisory/15 text-severity-advisory'
}

/**
 * CAP 格式（W-C0033-003/004/005）帶的是官方判定的 severity，不用再靠關鍵字猜——
 * 只在豪雨／低溫／高溫這三種現象才拿得到，其餘現象仍只能靠上面的 severityClass 猜測。
 */
export function capSeverityClass(severity: string): string {
  switch (severity) {
    case 'Extreme':
      return 'bg-severity-emergency/15 text-severity-emergency'
    case 'Severe':
      return 'bg-severity-warning/15 text-severity-warning'
    case 'Moderate':
      return 'bg-severity-watch/15 text-severity-watch'
    default:
      return 'bg-severity-advisory/15 text-severity-advisory'
  }
}

export const CAP_SEVERITY_LABEL: Record<string, string> = {
  Minor: '輕微',
  Moderate: '中等',
  Severe: '嚴重',
  Extreme: '極端'
}

/** 海嘯資訊（E-A0014-001）的 ReportColor 是官方判定好的四階顏色字串（實測只出現這四種），
 *  直接對應同一組 --color-severity-* 分級，不用再靠關鍵字猜。 */
export function tsunamiColorClass(reportColor: string): string {
  switch (reportColor) {
    case '紅色':
      return 'bg-severity-emergency/15 text-severity-emergency'
    case '橙色':
      return 'bg-severity-warning/15 text-severity-warning'
    case '黃色':
      return 'bg-severity-watch/15 text-severity-watch'
    default:
      return 'bg-severity-advisory/15 text-severity-advisory'
  }
}

/** 土石流／大規模崩塌警戒（DebrisFlowAlertLevel）只有黃/紅兩級，直接對應同一組
 *  --color-severity-* 分級。 */
export function debrisFlowColorClass(level: string): string {
  return level === 'red' ? 'bg-severity-emergency/15 text-severity-emergency' : 'bg-severity-watch/15 text-severity-watch'
}

export const DEBRIS_FLOW_LEVEL_LABEL: Record<string, string> = {
  yellow: '黃色警戒',
  red: '紅色警戒'
}

export const DEBRIS_FLOW_TYPE_LABEL: Record<string, string> = {
  debris: '土石流',
  landslide: '大規模崩塌'
}
