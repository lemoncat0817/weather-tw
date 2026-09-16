import type { LightningFrame, LightningFramesResponse } from '#shared/types'

/**
 * CWA Observe_lightning.js 解析出的單一物件項目
 */
export interface RawLightningItem {
  img: string
  text: string
}

/**
 * 將 CWA 的 YYYY/MM/DD HH:mm 格式字串轉成台北時間 ISO 8601 (YYYY-MM-DDTHH:mm:00+08:00)
 */
export function parseCwaTimeToIso(text: string): string {
  // text: "2026/09/16 11:35"
  const m = text.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/)
  if (!m) return text
  const [, y, mon, d, h, min] = m
  return `${y}-${mon}-${d}T${h}:${min}:00+08:00`
}

/**
 * 解析 CWA 官網 Observe_lightning.js 的 JS 文字內容。格式如：
 * var LightningImg = {
 *   'size0':{ 0:{"img":'20260916113500_lgtl.jpg', 'text':'2026/09/16 11:35'}, ... },  // 大圖 3600x2700
 *   'size1':{ 0:{"img":'20260916113500_lgts.jpg', 'text':'2026/09/16 11:35'}, ... }   // 小圖 1000x1000
 * }
 * size0／size1 是同一批時間點的大小圖雙胞胎，不是兩批不同觀測——只取 lgts（小圖），
 * 一來與播放器的正方形容器版面完全吻合免裁切，二來單張只有 ~200KB（大圖 ~1MB），
 * 時間軸拖曳會密集切換影格，體積差 5 倍對播放流暢度影響很大。
 */
export function normalizeLightningJs(jsContent: string): LightningFramesResponse {
  const frames: LightningFrame[] = []

  const regex = /\{["']img["']\s*:\s*['"]([^'"]+_lgts\.jpg)['"]\s*,\s*["']text["']\s*:\s*['"]([^'"]+)['"]\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(jsContent)) !== null) {
    const imgFilename = match[1]
    const displayText = match[2]
    if (!imgFilename || !displayText) continue

    const isoTime = parseCwaTimeToIso(displayText)

    frames.push({
      time: isoTime,
      displayTime: displayText,
      url: `/api/lightning/image?t=${encodeURIComponent(imgFilename)}`
    })
  }

  // CWA 原始清單是最新在前（0 是最新），排序為時間正序（舊到新），供時間軸播放
  frames.sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))

  const latest = frames[frames.length - 1]
  const updatedAt = latest ? latest.time : new Date().toISOString()

  return {
    updatedAt,
    frames
  }
}
