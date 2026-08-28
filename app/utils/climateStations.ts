// C-B0024-001／C-B0027-001（近期觀測、氣候常態）只涵蓋有長期紀錄的署屬有人站，不是
// /api/observation/stations 那 300 多個自動測站都能查。選單必須是「兩份資料集都能查到」
// 的交集：C-B0027-001 的未過濾清單會混進新屋、田中、後龍、古坑、新北這種還沒有
// 1991-2020 常態的新站，以及金門、馬祖這種成對查詢會空回的站——選了就 404。
// 下列 24 站是 2026-08 對 production `/api/climate/{id}` 逐站確認過的可用清單（高雄見
// server/utils/normalize/climate.ts 的舊站對應）。
export interface ClimateStation {
  id: string
  name: string
}

export const CLIMATE_STATIONS: readonly ClimateStation[] = [
  { id: '466900', name: '淡水' },
  { id: '466910', name: '鞍部' },
  { id: '466920', name: '臺北' },
  { id: '466930', name: '竹子湖' },
  { id: '466940', name: '基隆' },
  { id: '466950', name: '彭佳嶼' },
  { id: '466990', name: '花蓮' },
  { id: '467080', name: '宜蘭' },
  { id: '467300', name: '東吉島' },
  { id: '467350', name: '澎湖' },
  { id: '467410', name: '臺南' },
  { id: '467420', name: '永康' },
  { id: '467441', name: '高雄' },
  { id: '467480', name: '嘉義' },
  { id: '467490', name: '臺中' },
  { id: '467530', name: '阿里山' },
  { id: '467540', name: '大武' },
  { id: '467550', name: '玉山' },
  { id: '467571', name: '新竹' },
  { id: '467590', name: '恆春' },
  { id: '467610', name: '成功' },
  { id: '467620', name: '蘭嶼' },
  { id: '467650', name: '日月潭' },
  { id: '467660', name: '臺東' }
]

export const DEFAULT_CLIMATE_STATION_ID = '466920' // 臺北，跟全站其他頁面的預設地區一致

export function isClimateStationId(id: string): boolean {
  return CLIMATE_STATIONS.some((s) => s.id === id)
}
