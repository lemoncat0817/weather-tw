import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAllTaiwanWeekStore = defineStore(
  'allTaiwanWeek',
  () => {
    // 搜尋關鍵字
    const districtKeyword = ref<string>('')
    // 縣市的Id
    const locationId = ref<string>('F-D0047-067')

    return { districtKeyword, locationId }
  },
  {
    persist: true
  }
)
