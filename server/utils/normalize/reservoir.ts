import { RESERVOIR_COORDS } from '../reservoirCoords'
import type { ReservoirStatus } from '#shared/types'

// ---------------------------------------------------------------------------
// 水庫水情（即時）＋ 水庫基本資料（容量規格），經濟部水利署水利資料開放平台
// ---------------------------------------------------------------------------
//
// 節錄自實際回應（2026-09-15 實測，這個平台完全不需要金鑰，能直接驗證）。

interface WraReservoirStatusRecord {
  reservoiridentifier: string
  observationtime: string
  waterlevel: string
  effectivewaterstoragecapacity: string
  inflowdischarge: string
  totaloutflow: string
}
export type WraReservoirStatusResponse = WraReservoirStatusRecord[]

interface WraReservoirCapacityRecord {
  reservoiridentifier: string
  capacity: string
  datetime: string
}
export type WraReservoirCapacityResponse = WraReservoirCapacityRecord[]

// 水利署這幾支資料集數值一律是字串，缺值用空字串表示（跟環境部同款慣例），另外
// 「設計有效容量」這類欄位偶爾會帶千分位逗號（如 "1,000.00"），要先清掉逗號才能轉數字
function parseWraNumber(v: string | undefined): number | null {
  if (v === undefined || v === '') return null
  const n = Number(v.replaceAll(',', ''))
  return Number.isNaN(n) ? null : n
}

/** observationtime 是 naive 的 "YYYY-MM-DDTHH:MM:SS"（已經是 ISO 格式但沒帶時區），
 *  實際是台北時間，補上 +08:00 才不會在 UTC 容器部署後全部位移 8 小時。 */
function toTaipeiIso(naive: string): string {
  return `${naive}+08:00`
}

/**
 * 水庫每日營運狀況（capacity 欄位）轉成「水庫代碼 → 有效庫容量」的查表，供即時水情
 * 算蓄水率時當分母。
 *
 * 這支資料集不是第一次嘗試的選擇——最初用的是「水庫基本資料」的「目前有效容量」，
 * 兩者聽起來像同一件事，實際上是水利署兩套獨立維護的容量數字，差距在部分水庫上
 * 高達 6~10 個百分點以上（翡翠水庫：86.4% vs. 官方 77.7%；曾文水庫：96.4% vs.
 * 官方 100%）。拿官方防災資訊網（fhy.wra.gov.tw/fhyv2/monitor/reservoir）目前
 * 顯示的「有效庫容量」逐一核對後，這支「水庫每日營運狀況」的 capacity 才是官方看板
 * 實際使用的分母——18 座水庫全數核對到小數點後一位完全吻合，不是巧合。
 * 「水庫基本資料」很可能是年度公告用的規制容量，不是這套即時看板的即時參照值。
 *
 * 這支資料集實測是「一天一筆、不累積歷史」（不像水情本身混雜多個觀測時間點），
 * 但這裡還是防禦性地只取每個水庫最新一筆，不假設上游行為不會變。
 */
export function normalizeReservoirCapacities(raw: WraReservoirCapacityResponse): Record<string, number> {
  const latestById = new Map<string, WraReservoirCapacityRecord>()
  for (const r of raw) {
    const existing = latestById.get(r.reservoiridentifier)
    if (!existing || r.datetime > existing.datetime) {
      latestById.set(r.reservoiridentifier, r)
    }
  }

  const result: Record<string, number> = {}
  for (const [id, r] of latestById) {
    const capacity = parseWraNumber(r.capacity)
    if (capacity !== null) result[id] = capacity
  }
  return result
}

/**
 * 即時水情原始回應混雜多個觀測時間點（不像 CWA 大多數即時資料集只回傳「現在」這一筆），
 * 同一水庫會出現好幾筆不同 observationtime；這裡只取每個水庫最新的一筆。
 * 只保留在 RESERVOIR_COORDS 查得到座標的水庫，其餘（約 30 個沒有公告容量規格的小型埤塘）
 * 濾掉——沒有座標、也沒有容量脈絡可以判讀蓄水率，畫出來沒有意義。
 */
export function normalizeReservoirStatuses(
  raw: WraReservoirStatusResponse,
  capacities: Record<string, number>
): ReservoirStatus[] {
  const latestById = new Map<string, WraReservoirStatusRecord>()
  for (const r of raw) {
    const existing = latestById.get(r.reservoiridentifier)
    if (!existing || r.observationtime > existing.observationtime) {
      latestById.set(r.reservoiridentifier, r)
    }
  }

  const result: ReservoirStatus[] = []
  for (const [id, r] of latestById) {
    const coords = RESERVOIR_COORDS[id]
    if (!coords) continue

    const currentCapacity = parseWraNumber(r.effectivewaterstoragecapacity)
    const fullCapacity = capacities[id]
    const storagePercentage =
      currentCapacity !== null && fullCapacity ? Math.round((currentCapacity / fullCapacity) * 1000) / 10 : null

    result.push({
      id,
      name: coords.name,
      coordinates: { lat: coords.lat, lon: coords.lon },
      observationTime: toTaipeiIso(r.observationtime),
      waterLevel: parseWraNumber(r.waterlevel),
      storagePercentage,
      inflow: parseWraNumber(r.inflowdischarge),
      outflow: parseWraNumber(r.totaloutflow)
    })
  }
  return result
}
