// 圖表資料色階 —— 依 dataviz skill 的方法產生：色彩最後才決定，且用 script 驗證過，不是憑感覺挑的。
// 這裡的色票只給「圖表標記」用（線、長條、choropleth 填色），跟 UI 層級的警特報嚴重度色票
// （app/assets/css/main.css 的 --color-severity-*，對應 CWA 官方特報分級）分開，兩者語意不同、互不影響。
//
// 已用 scripts/validate_palette.js 對照本站的深色卡片底色 #0b1220 驗證過：
//   categorical（8色）：全部通過（lightness band / chroma floor / CVD ΔE≥8.4 / normal-vision ΔE≥19.3 / contrast≥3:1）
//   status（4色）：contrast 全部 >=3:1（lightness band/CVD 檢查不適用於 status，skill 文件本身註明）
//   sequential 藍階：contrast 呈 WARN 屬預期行為 —— 最暗兩階本來就代表「趨近 0」，設計上就該不顯眼

/** 分類色階（8 色），順序是 CVD 安全機制的一部分，永遠不重排、不循環使用 */
export const CATEGORICAL: readonly string[] = [
  '#3987e5', // 1 blue
  '#d95926', // 2 orange
  '#199e70', // 3 aqua
  '#c98500', // 4 yellow
  '#d55181', // 5 magenta
  '#008300', // 6 green
  '#9085e9', // 7 violet
  '#e66767' // 8 red
]

/** 狀態色階（固定語意，永遠不用於一般分類資料），供警特報以外、圖表內需要標示狀態的地方使用 */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b'
} as const

const clamp01 = (t: number) => Math.max(0, Math.min(1, t))

/** 在一組 hex 色階上依 t∈[0,1] 做線性插值（sRGB 空間，足夠圖表用途） */
function interpolateHexRamp(ramp: readonly string[], t: number): string {
  const clamped = clamp01(t)
  const scaled = clamped * (ramp.length - 1)
  const i = Math.floor(scaled)
  const frac = scaled - i
  if (i >= ramp.length - 1) return ramp[ramp.length - 1]!

  const a = hexToRgb(ramp[i]!)
  const b = hexToRgb(ramp[i + 1]!)
  const mix = a.map((v, idx) => Math.round(v + (b[idx]! - v) * frac))
  return rgbToHex(mix as [number, number, number])
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}

// 降水量（連續藍階，light→dark，來自驗證過的 sequential 藍階，step 100→700）
const PRECIPITATION_RAMP = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
  '#0d366b'
] as const

/** 降雨量 → 顏色。t 建議用 mm 值除以一個合理上限（例如 50mm）後 clamp 到 [0,1] */
export function precipitationColor(t: number): string {
  return interpolateHexRamp(PRECIPITATION_RAMP, t)
}

// 溫度發散色階：藍（冷）↔ 灰（中性）↔ 紅（熱），兩臂用完全相同的 OKLCH 明度/彩度階梯只換色相，
// 紅臂由 scripts 內建的 OKLab↔sRGB 轉換算出（見 commit 說明），不是手動配色
const TEMPERATURE_COLD_RAMP = ['#0d366b', '#184f95', '#256abf', '#3987e5', '#86b6ef', '#cde2fb'] as const
const TEMPERATURE_NEUTRAL = '#383835' // dark 模式的 diverging 中性灰
const TEMPERATURE_HOT_RAMP = ['#fad6d3', '#ea9a96', '#d75758', '#c7474b', '#892b2e', '#621b1e'] as const

/** 溫度 → 顏色。t∈[-1,1]，0 代表中性（例如設定為某個基準溫度），-1/1 為色階兩端已經飽和 */
export function temperatureColor(t: number): string {
  if (t === 0) return TEMPERATURE_NEUTRAL
  if (t < 0) return interpolateHexRamp([...TEMPERATURE_COLD_RAMP].reverse(), 1 + t)
  return interpolateHexRamp(TEMPERATURE_HOT_RAMP, t)
}

// 風速 / 地震震度：都是「單調遞增的嚴重程度」而非分類或正負對比，
// 用 status 四色當錨點內插成連續色階（good→warning→serious→critical），比另外發明一組色相更省心，
// 且天生跟「危險程度」的直覺一致
const SEVERITY_RAMP = [STATUS.good, STATUS.warning, STATUS.serious, STATUS.critical] as const

/** 風速 → 顏色。t 建議用風速（m/s）除以合理上限（例如 30 m/s，接近 12 級風）後 clamp 到 [0,1] */
export function windSpeedColor(t: number): string {
  return interpolateHexRamp(SEVERITY_RAMP, t)
}

// 中央氣象署地震震度分級（0級 ~ 7級，含 5弱/5強、6弱/6強），共 10 階，用同一組嚴重度色階映射
const INTENSITY_LEVELS = ['0級', '1級', '2級', '3級', '4級', '5弱', '5強', '6弱', '6強', '7級'] as const

/** 地震震度標籤（如 "5弱"）→ 顏色 */
export function seismicIntensityColor(label: string): string {
  const i = INTENSITY_LEVELS.indexOf(label as (typeof INTENSITY_LEVELS)[number])
  if (i === -1) return STATUS.good
  return interpolateHexRamp(SEVERITY_RAMP, i / (INTENSITY_LEVELS.length - 1))
}
