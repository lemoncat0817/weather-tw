import { computed, watch, type Ref } from 'vue'

// 五個地區各自涵蓋的縣市名單。原本 7 個 view（thirtySixHours、threeDays、week、
// nowWeather、autoStation、autoStationRain、nowWeatherWarning）各自維護一份逐字相同的常數，
// 現在集中在這裡，只維護一份。
export const REGIONS = {
  north: ['臺北市', '新北市', '基隆市', '新竹市', '桃園市', '新竹縣', '宜蘭縣'],
  mid: ['臺中市', '苗栗縣', '彰化縣', '南投縣', '雲林縣'],
  south: ['高雄市', '臺南市', '嘉義市', '嘉義縣', '屏東縣'],
  east: ['花蓮縣', '臺東縣'],
  out: ['金門縣', '連江縣', '澎湖縣']
} as const

// 對應各 Pinia store 裡的 5 個地區篩選開關（thirtySixHoursStore、nowWeatherStore...等
// 都是同樣的形狀），直接讀 store 上的 boolean 屬性即可觸發 Vue 的響應式追蹤。
export interface RegionFilterStore {
  north: boolean
  mid: boolean
  south: boolean
  east: boolean
  out: boolean
}

interface UseRegionFilterOptions {
  // 使用者沒有勾選任何地區時要做的事。
  // 大部分 view（thirtySixHours/threeDays/week/nowWeatherWarning）不需要這個選項，
  // 直接回傳原始資料；少數 view（nowWeather/autoStation/autoStationRain）原本會
  // 在這個情境下重新發送請求，為了不改變原本行為，用這個 callback 保留該差異。
  onNoRegionSelected?: () => void
  // 地區勾選狀態改變時要做的事（通常是把篩選結果寫回來源 ref、並重新請求資料）。
  onRegionChange?: () => void
}

// 依縣市名稱做地區篩選：把 7 個 view 重複的「地區名單 + filter computed + watch」邏輯收斂到這裡。
// getCountyName 用來從一筆資料取出縣市名稱，因為各 view 的欄位路徑不同
// （例如 locationName，或觀測資料類 view 的 GeoInfo.CountyName）。
export function useRegionFilter<T>(
  source: Ref<T[]>,
  store: RegionFilterStore,
  getCountyName: (item: T) => string,
  options?: UseRegionFilterOptions
) {
  const filtered = computed(() => {
    const filterByArea = (area: readonly string[]) =>
      source.value.filter((item) => area.includes(getCountyName(item)))

    let result: T[] = []
    if (store.east) result = result.concat(filterByArea(REGIONS.east))
    if (store.south) result = result.concat(filterByArea(REGIONS.south))
    if (store.mid) result = result.concat(filterByArea(REGIONS.mid))
    if (store.north) result = result.concat(filterByArea(REGIONS.north))
    if (store.out) result = result.concat(filterByArea(REGIONS.out))

    const noneSelected = !store.east && !store.south && !store.mid && !store.north && !store.out
    if (noneSelected) {
      if (options?.onNoRegionSelected) {
        options.onNoRegionSelected()
        return result
      }
      return source.value
    }
    return result
  })

  watch(
    () => [store.east, store.south, store.mid, store.north, store.out],
    () => {
      source.value = filtered.value
      options?.onRegionChange?.()
    }
  )

  return { filtered }
}
