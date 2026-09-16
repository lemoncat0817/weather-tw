import type { LightningFrame } from '#shared/types'

export type DecodedLightningImage = ImageBitmap | HTMLImageElement

export interface LightningBitmapCache {
  /** 取得某一格的已解碼影像；同一格若正在載入會共用 Promise。失敗回 null */
  get: (frame: LightningFrame) => Promise<DecodedLightningImage | null>
  /** 同步取得已在快取中的解碼影像；未解碼則回 null */
  getImmediate: (frame: LightningFrame) => DecodedLightningImage | null
  /** 背景滑動視窗預載：預載從 currentIndex 往前與往後的指定範圍影格（支援循環播放環狀預載） */
  prefetchWindow: (frames: LightningFrame[], currentIndex: number, ahead?: number, behind?: number) => void
  /** 只保留保留清單內的影格解碼結果，其餘釋放以控管記憶體 */
  retain: (keepFrames: LightningFrame[]) => void
  /** 元件卸載時呼叫：中止進行中的請求並釋放所有解碼資源 */
  dispose: () => void
}

async function decodeFrame(url: string, signal: AbortSignal): Promise<DecodedLightningImage> {
  if (typeof createImageBitmap !== 'undefined') {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`閃電影像載入失敗（HTTP ${res.status}）`)
    const blob = await res.blob()
    try {
      return await createImageBitmap(blob)
    } catch {
      // 容錯降級至 Image 物件
    }
  }

  // Fallback 或不支援 createImageBitmap 的執行環境
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const img = new Image()
    const onAbort = () => {
      img.src = ''
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })

    img.crossOrigin = 'anonymous'
    img.src = url
    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(() => {
          signal.removeEventListener('abort', onAbort)
          resolve(img)
        })
        .catch((err) => {
          signal.removeEventListener('abort', onAbort)
          reject(err)
        })
    } else {
      img.onload = () => {
        signal.removeEventListener('abort', onAbort)
        resolve(img)
      }
      img.onerror = (err) => {
        signal.removeEventListener('abort', onAbort)
        reject(err)
      }
    }
  })
}

function freeImage(image: DecodedLightningImage) {
  if ('close' in image && typeof image.close === 'function') {
    image.close()
  } else if ('src' in image) {
    image.src = ''
  }
}

export function createLightningBitmapCache(): LightningBitmapCache {
  const cache = new Map<string, DecodedLightningImage>()
  const inflight = new Map<string, Promise<DecodedLightningImage | null>>()
  const controller = new AbortController()
  let disposed = false

  async function get(frame: LightningFrame): Promise<DecodedLightningImage | null> {
    if (disposed) return null
    const cached = cache.get(frame.url)
    if (cached) return cached

    const existing = inflight.get(frame.url)
    if (existing) return existing

    const task = decodeFrame(frame.url, controller.signal)
      .then((decoded) => {
        if (disposed) {
          freeImage(decoded)
          return null
        }
        cache.set(frame.url, decoded)
        return decoded
      })
      .catch(() => null)
      .finally(() => {
        inflight.delete(frame.url)
      })

    inflight.set(frame.url, task)
    return task
  }

  const instance: LightningBitmapCache = {
    get,
    getImmediate(frame: LightningFrame) {
      return cache.get(frame.url) ?? null
    },
    prefetchWindow(frames: LightningFrame[], currentIndex: number, ahead = 10, behind = 3) {
      if (disposed || frames.length === 0) return
      const targetIndices = new Set<number>()
      const len = frames.length

      // 往前預載 (behind)
      for (let i = 1; i <= behind; i++) {
        targetIndices.add((currentIndex - i + len) % len)
      }
      // 當前幀
      targetIndices.add(currentIndex)
      // 往後預載 (ahead，支援循環)
      for (let i = 1; i <= ahead; i++) {
        targetIndices.add((currentIndex + i) % len)
      }

      const keepFrames: LightningFrame[] = []
      for (const idx of targetIndices) {
        const f = frames[idx]
        if (f) {
          keepFrames.push(f)
          void instance.get(f)
        }
      }

      // 當快取量過多（超過 30 幀）時釋放不在當前視窗內的影格，控管記憶體
      if (cache.size > 30) {
        const keepSet = new Set(keepFrames.map((f) => f.url))
        for (const [url, img] of cache) {
          if (!keepSet.has(url)) {
            freeImage(img)
            cache.delete(url)
          }
        }
      }
    },
    retain(keepFrames: LightningFrame[]) {
      const keep = new Set(keepFrames.map((f) => f.url))
      for (const [url, img] of cache) {
        if (!keep.has(url)) {
          freeImage(img)
          cache.delete(url)
        }
      }
    },
    dispose() {
      disposed = true
      controller.abort()
      for (const img of cache.values()) freeImage(img)
      cache.clear()
      inflight.clear()
    }
  }

  return instance
}
