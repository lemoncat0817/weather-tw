import { describe, expect, it } from 'vitest'
import {
  determineStatusType,
  normalizeDgpaHtml
} from '../workSchoolStatus'

const NORMAL_HTML = `
<!DOCTYPE html>
<html>
<body>
<table class="Table_Body">
  <tr><th>縣市名稱</th><th>是否停止上班上課情形</th></tr>
  <tr><td colspan="2">無停班停課訊息。</td></tr>
</table>
</body>
</html>
`

const DISASTER_HTML = `
<!DOCTYPE html>
<html>
<body>
<table class="Table_Body">
  <tr><th>縣市名稱</th><th>是否停止上班上課情形</th></tr>
  <tr><td>基隆市</td><td>照常上班、照常上課。</td></tr>
  <tr><td>臺北市</td><td>照常上班、照常上課。</td></tr>
  <tr><td>高雄市</td><td>今日停止上班、停止上課。</td></tr>
  <tr><td>花蓮縣</td><td>秀林鄉和平村停止上班、停止上課。</td></tr>
</table>
</body>
</html>
`

describe('normalizeDgpaHtml', () => {
  it('平時「無停班停課訊息」時，所有 22 縣市皆為 normal', () => {
    const res = normalizeDgpaHtml(NORMAL_HTML)
    expect(res.isDefaultStatus).toBe(true)
    expect(res.counties).toHaveLength(22)
    for (const c of res.counties) {
      expect(c.status).toBe('normal')
      expect(c.statusText).toBe('照常上班、照常上課')
    }
  })

  it('天災時正確識別全縣市停班停課 (suspended) 與局部停班停課 (partial)', () => {
    const res = normalizeDgpaHtml(DISASTER_HTML)
    expect(res.isDefaultStatus).toBe(false)
    expect(res.counties).toHaveLength(22)

    const kaohsiung = res.counties.find((c) => c.county === '高雄市')
    expect(kaohsiung).toBeDefined()
    expect(kaohsiung!.status).toBe('suspended')
    expect(kaohsiung!.statusText).toContain('今日停止上班、停止上課')

    const hualien = res.counties.find((c) => c.county === '花蓮縣')
    expect(hualien).toBeDefined()
    expect(hualien!.status).toBe('partial')
    expect(hualien!.statusText).toContain('和平村停止上班、停止上課')

    const keelung = res.counties.find((c) => c.county === '基隆市')
    expect(keelung).toBeDefined()
    expect(keelung!.status).toBe('normal')
  })

  it('determineStatusType 正確判定字串狀態', () => {
    expect(determineStatusType('照常上班、照常上課')).toBe('normal')
    expect(determineStatusType('停止上班、停止上課')).toBe('suspended')
    expect(determineStatusType('秀林鄉和平村停止上班、停止上課')).toBe('partial')
    expect(determineStatusType('除復興區外照常上班、照常上課')).toBe('partial')
  })
})
