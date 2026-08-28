import type { ExpressionSpecification } from 'maplibre-gl'

/**
 * 把 app/utils/colorScales.ts 的色階函式（吃 t∈[0,1] 或 [-1,1]）取樣成固定的色階梯，
 * 組成 MapLibre 的 interpolate expression——MapLibre 的 style 表達式沒辦法呼叫任意 JS
 * 函式，只能吃這種「數值→色票」的靜態梯度定義，所以在這裡做一次轉換。
 */
export function buildLinearColorExpression(
  field: string,
  domain: [number, number],
  colorFn: (t: number) => string,
  steps = 7
): ExpressionSpecification {
  const [min, max] = domain
  const stops: (string | number)[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1) // 0..1
    const value = min + t * (max - min)
    stops.push(value, colorFn(t))
  }
  return ['interpolate', ['linear'], ['get', field], ...stops] as unknown as ExpressionSpecification
}

/** 溫度專用：colorScales.temperatureColor 吃的是 t∈[-1,1]，這裡固定用 15~35°C 當常見範圍 */
export function temperatureColorExpression(field: string, colorFn: (t: number) => string): ExpressionSpecification {
  const steps = 7
  const stops: (string | number)[] = []
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * 2 - 1 // -1..1
    const value = 25 + t * 10 // 15..35°C
    stops.push(value, colorFn(t))
  }
  return ['interpolate', ['linear'], ['get', field], ...stops] as unknown as ExpressionSpecification
}

/** 風速專用：colorScales.windSpeedColor 吃 t∈[0,1]，這裡固定用 0~50 m/s（涵蓋強颱等級）當範圍 */
export function windSpeedColorExpression(field: string, colorFn: (t: number) => string): ExpressionSpecification {
  return buildLinearColorExpression(field, [0, 50], colorFn, 6)
}

/**
 * 熱傷害等級專用：level 是離散字串（'none'/'caution'/...），不是連續數值，不能用 interpolate，
 * 改用 MapLibre 的 match expression 逐一列舉；colorFn 吃法跟 colorScales.heatInjuryColor 一致。
 */
export function heatInjuryColorExpression(field: string, colorFn: (level: string) => string): ExpressionSpecification {
  const levels = ['caution', 'watch', 'danger', 'high-danger']
  const cases = levels.flatMap((level) => [level, colorFn(level)])
  return ['match', ['get', field], ...cases, colorFn('none')] as unknown as ExpressionSpecification
}
