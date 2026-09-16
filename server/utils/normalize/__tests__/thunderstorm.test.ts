import { describe, expect, it } from 'vitest'
import {
  normalizeThunderstormAndInstantAlerts,
  parseCwaDateTimeToIso
} from '../thunderstorm'

const SAMPLE_WARNING_JS = `
var WarnContent = {
	'W25':{
		'C':{
			'title':'陸上強風特報',
			'issued':'2026/09/16 10:33',
			'validto':'2026/09/17 19:00',
			'content':'東北風偏強，今(16)日上午至明(17)日晚上桃園市、苗栗縣局部地區有平均風6級以上。',
			'content_web':'一、概述...'
		}
	}
};
var WarnContent_W33 = [
  {
    "id": "1",
    "title": "大雷雨即時訊息",
    "issued": "2026/09/16 11:30",
    "validto": "2026/09/16 12:30",
    "content": "旺盛發展對流常伴隨打雷、閃電與劇烈降雨，請注意安全。",
    "areas": ["臺北市", "新北市"]
  }
];
`

describe('normalizeThunderstormAndInstantAlerts', () => {
  it('parseCwaDateTimeToIso 轉為 +08:00 格式', () => {
    const iso = parseCwaDateTimeToIso('2026/09/16 10:33')
    expect(iso).toBe('2026-09-16T10:33:00+08:00')
  })

  it('正確解析大雷雨即時訊息 (W33) 與特報快報', () => {
    const res = normalizeThunderstormAndInstantAlerts(SAMPLE_WARNING_JS)
    expect(res.alerts.length).toBeGreaterThanOrEqual(2)

    const thunderstorm = res.alerts.find((a) => a.type === 'thunderstorm')
    expect(thunderstorm).toBeDefined()
    expect(thunderstorm!.title).toBe('大雷雨即時訊息')
    expect(thunderstorm!.severity).toBe('warning')
    expect(thunderstorm!.affectedAreas).toContain('臺北市')

    const wind = res.alerts.find((a) => a.type === 'wind')
    expect(wind).toBeDefined()
    expect(wind!.title).toBe('陸上強風特報')
    expect(wind!.affectedAreas).toContain('桃園市')
  })
})
