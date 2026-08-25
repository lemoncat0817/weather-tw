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
