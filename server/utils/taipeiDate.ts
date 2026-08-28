/**
 * 今天的台北日期（YYYY-MM-DD）。伺服器可能跑在 UTC 容器裡，不能用 new Date() 的日曆方法
 * （getFullYear/getMonth/getDate 都是「執行環境本地時區」），跟 app/utils/formatDate.ts
 * 用同一招——Intl.DateTimeFormat 指定 timeZone，不看執行環境臉色。
 */
export function todayInTaipei(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  return `${map.year}-${map.month}-${map.day}`
}
