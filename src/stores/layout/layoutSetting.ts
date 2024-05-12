import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useLayoutSettingStore = defineStore(
  'layoutSetting',
  () => {
    const dark = ref<boolean>(false)
    const color = ref<string>('rgba(255, 69, 0, 0.68)')

    return { dark, color }
  },
  {
    persist: true
  }
)
