// 「健康氣象」三個因子（熱傷害/冷傷害/溫差提醒）形狀完全相同，差別只在上游資料集、
// 涵蓋的時間範圍與顯示文字，集中在這裡設定，/health 的兩個頁面都靠這份設定切換因子。
export type HealthMetric = 'heat' | 'cold' | 'temperature-difference'

export interface HealthMetricConfig {
  /** API 路徑片段：/api/health/{path}/summary、/api/health/{path}/{county}/{town} */
  path: string
  label: string
  seriesName: string
  /** 上游資料集實際涵蓋的時間範圍——熱傷害是 5 天，冷傷害／溫差提醒只有 72 小時，不能都寫死成同一句文案 */
  durationLabel: string
  datasetNote: string
}

export const HEALTH_METRICS: Record<HealthMetric, HealthMetricConfig> = {
  heat: {
    path: 'heat',
    label: '熱傷害',
    seriesName: '熱傷害指數',
    durationLabel: '未來 5 天',
    datasetNote: '中央氣象署健康氣象（M-A0085-001）'
  },
  cold: {
    path: 'cold',
    label: '冷傷害',
    seriesName: '冷傷害指數',
    durationLabel: '未來 72 小時',
    datasetNote: '中央氣象署健康氣象（F-A0085-003）'
  },
  'temperature-difference': {
    path: 'temperature-difference',
    label: '溫差提醒',
    seriesName: '溫差提醒指數',
    durationLabel: '未來 72 小時',
    datasetNote: '中央氣象署健康氣象（F-A0085-005）'
  }
}

export const HEALTH_METRIC_LIST: HealthMetric[] = ['heat', 'cold', 'temperature-difference']
