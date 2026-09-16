import { normalizeLightningJs } from '../../utils/normalize/lightning'
import type { LightningFramesResponse } from '#shared/types'

const LIGHTNING_JS_URL = 'https://www.cwa.gov.tw/Data/js/obs_img/Observe_lightning.js'

/**
 * 取得 CWA 即時閃電觀測的時間序列影格清單。
 * 官方約每 5 分鐘更新一次最新觀測影像，快取設定 5 分鐘。
 */
export default defineCachedEventHandler(
  async (): Promise<LightningFramesResponse> => {
    try {
      const jsText = await $fetch<string>(LIGHTNING_JS_URL, {
        responseType: 'text',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10_000
      })
      return normalizeLightningJs(jsText)
    } catch {
      return {
        updatedAt: new Date().toISOString(),
        frames: []
      }
    }
  },
  { maxAge: 60 * 5, name: 'lightning-frames' }
)
