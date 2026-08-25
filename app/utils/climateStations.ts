// C-B0024-001／C-B0027-001（近期觀測、氣候常態）只涵蓋 CWA「署屬有人氣象站」這組固定的長期測站，
// 不是 /api/observation/stations 那 300 多個自動測站都能查——若拿完整測站清單當選單，使用者選到
// 沒有長期紀錄的站會直接 404。這裡直接列出 CWA 目前公開的完整清單（31 站，實測 C-B0027-001 取得），
// 站數少且幾乎不變，不需要額外打一次 API 才能組出選單。
export interface ClimateStation {
  id: string
  name: string
}

export const CLIMATE_STATIONS: readonly ClimateStation[] = [
  { id: '466881', name: '新北' },
  { id: '466900', name: '淡水' },
  { id: '466910', name: '鞍部' },
  { id: '466920', name: '臺北' },
  { id: '466930', name: '竹子湖' },
  { id: '466940', name: '基隆' },
  { id: '466950', name: '彭佳嶼' },
  { id: '466990', name: '花蓮' },
  { id: '467050', name: '新屋' },
  { id: '467080', name: '宜蘭' },
  { id: '467110', name: '金門' },
  { id: '467270', name: '田中' },
  { id: '467280', name: '後龍' },
  { id: '467290', name: '古坑' },
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
  { id: '467660', name: '臺東' },
  { id: '467990', name: '馬祖' }
]

export const DEFAULT_CLIMATE_STATION_ID = '466920' // 臺北，跟全站其他頁面的預設地區一致
