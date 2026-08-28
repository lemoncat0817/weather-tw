// O-B0075-001（浮標站與潮位站海況觀測）不像 climateStations.ts 能對照到公開、有正式中文站名的
// 署屬有人站——這些是浮標，CWA 開放資料本身只給站號代碼，查過 Swagger 全部 80 個端點也沒有
// 對應的站名／座標中繼資料 API。與其自己編造站名，這裡只列出 2026-08 對 production
// `/api/ocean/buoy/{id}` 逐站確認過「有真實浪高/週期資料」（不是全部欄位都是 None 的純潮位站）
// 的站號，選單上誠實只顯示代碼本身。
export const OCEAN_BUOY_STATIONS: readonly string[] = [
  'C6AH2',
  '46757B',
  'WRA005',
  '46761F',
  'C6G01',
  'C6W08',
  '46778A',
  '46706A',
  'C6V27',
  'C6S94',
  'COMC08',
  '46787A',
  'NTU02',
  'C6B01',
  '46735A',
  'WRA007',
  'C6W10',
  '46759A',
  'C6N01',
  'C6D01',
  'C6F01',
  'NTU01',
  '46694A',
  '46699A',
  '46708A'
]

export const DEFAULT_OCEAN_BUOY_STATION = OCEAN_BUOY_STATIONS[0]!

export function isOceanBuoyStation(id: string): boolean {
  return OCEAN_BUOY_STATIONS.includes(id)
}
