import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAllTaiwanStore = defineStore(
  'allTaiwan',
  () => {
    // 搜尋關鍵字
    const districtKeyword = ref<string>('')
    // 縣市的Id
    const locationId = ref<string>('F-D0047-065')

    return { districtKeyword, locationId }
  },
  {
    persist: true
  }
)
