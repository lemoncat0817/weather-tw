// F-D0047-093（鄉鎮逐時/延伸預報）需要用 locationId 參數指定「縣市 dataset id」
// 才能查特定鄉鎮，locationId 本身不是鄉鎮名稱。這裡是完整 22 縣市對照表
// （實測 CWA OpenAPI spec 得出，非文件臆測）。

interface CountyDatasetIds {
  /** 3 天版（逐時），奇數 */
  threeDay: string
  /** 1 週版（6 小時一格），偶數 */
  week: string
}

export const COUNTY_DATASETS: Record<string, CountyDatasetIds> = {
  宜蘭縣: { threeDay: 'F-D0047-001', week: 'F-D0047-003' },
  桃園市: { threeDay: 'F-D0047-005', week: 'F-D0047-007' },
  新竹縣: { threeDay: 'F-D0047-009', week: 'F-D0047-011' },
  苗栗縣: { threeDay: 'F-D0047-013', week: 'F-D0047-015' },
  彰化縣: { threeDay: 'F-D0047-017', week: 'F-D0047-019' },
  南投縣: { threeDay: 'F-D0047-021', week: 'F-D0047-023' },
  雲林縣: { threeDay: 'F-D0047-025', week: 'F-D0047-027' },
  嘉義縣: { threeDay: 'F-D0047-029', week: 'F-D0047-031' },
  屏東縣: { threeDay: 'F-D0047-033', week: 'F-D0047-035' },
  臺東縣: { threeDay: 'F-D0047-037', week: 'F-D0047-039' },
  花蓮縣: { threeDay: 'F-D0047-041', week: 'F-D0047-043' },
  澎湖縣: { threeDay: 'F-D0047-045', week: 'F-D0047-047' },
  基隆市: { threeDay: 'F-D0047-049', week: 'F-D0047-051' },
  新竹市: { threeDay: 'F-D0047-053', week: 'F-D0047-055' },
  嘉義市: { threeDay: 'F-D0047-057', week: 'F-D0047-059' },
  臺北市: { threeDay: 'F-D0047-061', week: 'F-D0047-063' },
  高雄市: { threeDay: 'F-D0047-065', week: 'F-D0047-067' },
  新北市: { threeDay: 'F-D0047-069', week: 'F-D0047-071' },
  臺中市: { threeDay: 'F-D0047-073', week: 'F-D0047-075' },
  臺南市: { threeDay: 'F-D0047-077', week: 'F-D0047-079' },
  連江縣: { threeDay: 'F-D0047-081', week: 'F-D0047-083' },
  金門縣: { threeDay: 'F-D0047-085', week: 'F-D0047-087' }
}

export const COUNTY_NAMES = Object.keys(COUNTY_DATASETS)
