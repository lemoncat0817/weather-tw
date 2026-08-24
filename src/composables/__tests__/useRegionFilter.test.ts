import { describe, it, expect, vi } from 'vitest'
import { ref, reactive, nextTick } from 'vue'
import { useRegionFilter, type RegionFilterStore } from '../useRegionFilter'

interface Item {
  locationName: string
}

function makeStore(): RegionFilterStore {
  return reactive({ north: false, mid: false, south: false, east: false, out: false })
}

describe('useRegionFilter', () => {
  it('未勾選任何地區時，預設回傳原始資料', () => {
    const source = ref<Item[]>([{ locationName: '臺北市' }, { locationName: '高雄市' }])
    const store = makeStore()
    const { filtered } = useRegionFilter(source, store, (item) => item.locationName)
    expect(filtered.value).toEqual(source.value)
  })

  it('勾選單一地區時，只回傳該地區的縣市', () => {
    const source = ref<Item[]>([
      { locationName: '臺北市' }, // 北部
      { locationName: '高雄市' }, // 南部
      { locationName: '花蓮縣' } // 東部
    ])
    const store = makeStore()
    store.north = true
    const { filtered } = useRegionFilter(source, store, (item) => item.locationName)
    expect(filtered.value).toEqual([{ locationName: '臺北市' }])
  })

  it('勾選多個地區時，回傳各地區聯集', () => {
    const source = ref<Item[]>([
      { locationName: '臺北市' }, // 北部
      { locationName: '高雄市' }, // 南部
      { locationName: '花蓮縣' } // 東部
    ])
    const store = makeStore()
    store.north = true
    store.south = true
    const { filtered } = useRegionFilter(source, store, (item) => item.locationName)
    expect(filtered.value).toEqual([{ locationName: '高雄市' }, { locationName: '臺北市' }])
  })

  it('未勾選任何地區且提供 onNoRegionSelected 時，觸發 callback 並回傳空陣列', () => {
    const source = ref<Item[]>([{ locationName: '臺北市' }])
    const store = makeStore()
    const onNoRegionSelected = vi.fn()
    const { filtered } = useRegionFilter(source, store, (item) => item.locationName, {
      onNoRegionSelected
    })
    expect(filtered.value).toEqual([])
    expect(onNoRegionSelected).toHaveBeenCalled()
  })

  it('地區勾選狀態改變時，觸發 onRegionChange', async () => {
    const source = ref<Item[]>([{ locationName: '臺北市' }])
    const store = makeStore()
    const onRegionChange = vi.fn()
    useRegionFilter(source, store, (item) => item.locationName, { onRegionChange })
    store.north = true
    await nextTick()
    expect(onRegionChange).toHaveBeenCalledTimes(1)
  })
})
