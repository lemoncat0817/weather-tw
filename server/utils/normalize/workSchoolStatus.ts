import type {
  WorkSchoolCountyStatus,
  WorkSchoolStatusResponse,
  WorkSchoolStatusType
} from '#shared/types'

export const TAIWAN_COUNTIES = [
  '基隆市',
  '臺北市',
  '新北市',
  '桃園市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '臺中市',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義市',
  '嘉義縣',
  '臺南市',
  '高雄市',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
  '澎湖縣',
  '金門縣',
  '連江縣'
]

/**
 * 判斷狀態文字屬於哪一種狀態類型：
 * - 'suspended': 全縣市停止上班上課
 * - 'partial': 部分鄉鎮市區、村里或學校停止上班上課
 * - 'normal': 照常上班、照常上課
 * - 'pending': 未達停止標準或尚未通報
 */
export function determineStatusType(text: string): WorkSchoolStatusType {
  const clean = text.trim()
  if (clean.includes('除') && clean.includes('外')) {
    return 'partial'
  }

  if (!clean || clean.includes('照常上班') || clean.includes('照常上課')) {
    // 檢查是否有「除XX外」或「XX停止上班、其餘照常」的局部停班停課
    if (clean.includes('停止上班') || clean.includes('停止上課') || clean.includes('除')) {
      return 'partial'
    }
    return 'normal'
  }

  if (clean.includes('停止上班') || clean.includes('停止上課')) {
    // 若文字中出現鄉、鎮、市、區、村、里、校、國民小學等局部字眼
    if (
      clean.includes('鄉') ||
      clean.includes('鎮') ||
      clean.includes('區') ||
      clean.includes('村') ||
      clean.includes('里') ||
      clean.includes('國小') ||
      clean.includes('中學') ||
      clean.includes('高中') ||
      clean.includes('學校') ||
      clean.includes('部分')
    ) {
      return 'partial'
    }
    return 'suspended'
  }

  if (clean.includes('尚未列入') || clean.includes('未達停止') || clean.includes('未宣布')) {
    return 'normal'
  }

  return 'pending'
}

/**
 * 解析 DGPA 停班停課官方 HTML 內容。
 */
export function normalizeDgpaHtml(html: string): WorkSchoolStatusResponse {
  const nowIso = new Date().toISOString()

  // 1. 檢查是否為「無停班停課訊息」平時狀態
  if (html.includes('無停班停課訊息') || html.includes('目前無停班停課訊息')) {
    return {
      updatedAt: nowIso,
      isDefaultStatus: true,
      title: '無停班停課訊息（全台照常上班上課）',
      counties: TAIWAN_COUNTIES.map((county) => ({
        county,
        status: 'normal',
        statusText: '照常上班、照常上課'
      })),
      announcement: '目前全國各地無天然災害停止上班及上課訊息。'
    }
  }

  // 2. 有公告時，解析表格或文字列
  // DGPA 表格通常包含 <tr><td>縣市名稱</td><td>是否停止上班上課情形</td></tr>
  const countyStatusMap: Record<string, { statusText: string; details?: string }> = {}

  // 正則搜尋 <td>基隆市</td>...<td>內容</td> 或類似結構
  const rowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi
  let match: RegExpExecArray | null

  while ((match = rowRegex.exec(html)) !== null) {
    const rawCounty = match[1]?.replace(/<[^>]+>/g, '').trim()
    const rawStatus = match[2]?.replace(/<[^>]+>/g, '').trim()
    if (!rawCounty || !rawStatus) continue

    // 匹配對應的標準 22 縣市名稱（相容台/臺）
    const standardCounty = TAIWAN_COUNTIES.find(
      (c) =>
        c === rawCounty ||
        c === rawCounty.replace(/台/g, '臺') ||
        rawCounty.startsWith(c) ||
        rawCounty.startsWith(c.replace(/臺/g, '台'))
    )

    if (standardCounty && !rawStatus.includes('是否停止上班上課')) {
      countyStatusMap[standardCounty] = {
        statusText: rawStatus,
        details: rawStatus
      }
    }
  }

  // 3. 組合 22 縣市結果，未列出的縣市預設為照常上班上課
  const counties: WorkSchoolCountyStatus[] = TAIWAN_COUNTIES.map((county) => {
    const found = countyStatusMap[county]
    if (found) {
      return {
        county,
        status: determineStatusType(found.statusText),
        statusText: found.statusText,
        details: found.details
      }
    }
    return {
      county,
      status: 'normal',
      statusText: '照常上班、照常上課'
    }
  })

  const hasSuspended = counties.some((c) => c.status === 'suspended' || c.status === 'partial')

  return {
    updatedAt: nowIso,
    isDefaultStatus: !hasSuspended,
    title: hasSuspended ? '天然災害停止上班及上課通報' : '全台照常上班上課',
    counties,
    announcement: hasSuspended
      ? '天然災害應變期間，請隨時注意官方最新通報與安全避險。'
      : '目前無停班停課訊息。'
  }
}
