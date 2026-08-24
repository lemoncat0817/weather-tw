// 風標（wind barb）：氣象慣例——長橫代表 10 節、短橫代表 5 節、實心旗標代表 50 節，
// 風標桿朝「風的來向」延伸（例如北風的桿朝北）。CWA 逐時/延伸預報的風向是中文方位字串，
// 不是角度，這裡先轉角度（0°=北，順時針），再依風速（m/s→節）決定要畫幾根橫線/旗標。

// CWA 實測出現過「東北風」「偏北風」這種 8 方位＋「偏」字首的組合，這裡連 16 方位一起收錄，
// 涵蓋所有可能出現的中文風向命名，查不到就退回 null（呼叫端可選擇不畫風標桿）
const COMPASS_DEGREES: Record<string, number> = {
  北風: 0,
  偏北風: 0,
  北北東風: 22.5,
  東北風: 45,
  東北東風: 67.5,
  東風: 90,
  偏東風: 90,
  東南東風: 112.5,
  東南風: 135,
  南南東風: 157.5,
  南風: 180,
  偏南風: 180,
  南南西風: 202.5,
  西南風: 225,
  西南西風: 247.5,
  西風: 270,
  偏西風: 270,
  西北西風: 292.5,
  西北風: 315,
  北北西風: 337.5
}

export function windDirectionDegrees(direction: string): number | null {
  return COMPASS_DEGREES[direction] ?? null
}

const MS_TO_KNOTS = 1.9438

/** 風速節數需要「捨去到最近 5 節」再決定畫幾根旗標/長橫/短橫——這是氣象風標的標準畫法 */
function knotsToBarbs(knots: number): { pennants: number; longBarbs: number; shortBarb: boolean } {
  const rounded = Math.round(knots / 5) * 5
  const pennants = Math.floor(rounded / 50)
  const remainder = rounded % 50
  const longBarbs = Math.floor(remainder / 10)
  const shortBarb = remainder % 10 >= 5
  return { pennants, longBarbs, shortBarb }
}

export interface WindBarbGlyph {
  /** SVG path data，桿長固定 20（配合 22x22 viewBox），風速為 0 時只有一個小圈（靜風符號） */
  path: string
  /** 桿要旋轉的角度（度），對應風的來向；靜風時為 0 */
  rotationDeg: number
}

/**
 * 產生風標的 SVG path。桿沿 y 軸負方向（往上）畫，旗標/橫線長在桿的右側，
 * 呼叫端再用 rotationDeg 把整組符號轉到正確方位——這樣路徑本身永遠一致，只需轉動。
 */
export function windBarbGlyph(speedMs: number, direction: string | null): WindBarbGlyph {
  const knots = speedMs * MS_TO_KNOTS
  const rotationDeg = direction ? windDirectionDegrees(direction) ?? 0 : 0

  // 靜風（<1 節）：畫一個小圈，不畫桿
  if (knots < 1) {
    return { path: 'M0,0 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0', rotationDeg: 0 }
  }

  const SHAFT_LEN = 20
  const BARB_LEN = 6
  const BARB_GAP = 3.2
  const { pennants, longBarbs, shortBarb } = knotsToBarbs(knots)

  // 桿：從圓心 (0,0) 往上（負 y）畫到 (0,-SHAFT_LEN)
  let path = `M0,0 L0,${-SHAFT_LEN}`
  let pos = -SHAFT_LEN // 從桿頂開始往下（往圓心方向）依序排列旗標/橫線

  for (let i = 0; i < pennants; i++) {
    // 三角旗標：實心三角形，底邊在桿上
    path += ` M0,${pos} L${BARB_LEN},${pos + BARB_GAP * 0.6} L0,${pos + BARB_GAP} Z`
    pos += BARB_GAP
  }
  for (let i = 0; i < longBarbs; i++) {
    path += ` M0,${pos} L${BARB_LEN},${pos - BARB_GAP * 0.5}`
    pos += BARB_GAP
  }
  if (shortBarb) {
    path += ` M0,${pos} L${BARB_LEN * 0.55},${pos - BARB_GAP * 0.3}`
  }

  return { path, rotationDeg }
}
