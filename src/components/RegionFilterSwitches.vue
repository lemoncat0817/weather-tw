<template>
  <!-- 依縣市所在區域篩選：5 個地區開關 + 重置按鈕。
       原本在 nowWeather/autoStation/autoStationRain/nowWeatherWarning 這 4 個 view 裡，
       各自的桌面版、手機版 dropdown 都各複製一份（合計 8 份）逐字相同的 markup，收斂到這裡。 -->
  <!-- eslint-disable vue/no-mutating-props -- store 是呼叫端傳進來的 Pinia store 實例，不是這個
       元件自己擁有的資料，直接改它自己的欄位是正常的 Pinia 用法（跟原本每個 view 裡
       v-model="xxxStore.north" 是同一件事），不是真的在改「元件的 props」 -->
  <div class="filter">
    <span style="color:red; font-size: 25px; font-weight: bold;">依照縣市所在區域篩選:</span>
    <span>北部:</span>
    <el-switch v-model="store.north" />
    <span>中部:</span>
    <el-switch v-model="store.mid" />
    <span>南部:</span>
    <el-switch v-model="store.south" />
    <span>東部:</span>
    <el-switch v-model="store.east" />
    <span>離島:</span>
    <el-switch v-model="store.out" />
    <el-button style="margin-left: 10px;" type="primary" @click="store.resetFilter">重置篩選</el-button>
  </div>
</template>

<script setup lang="ts">
// store 是 Pinia store 實例本身（reactive proxy），直接綁定其 north/mid/south/east/out 欄位
// 屬於 Pinia 慣例用法；resetFilter 是每個 store 都有的方法。
defineProps<{
  store: {
    north: boolean
    mid: boolean
    south: boolean
    east: boolean
    out: boolean
    resetFilter: () => void
  }
}>()
</script>

<style scoped lang="scss">
// 4 個原始 view 的 .filter 樣式逐字相同（含唯一的 1280px 斷點覆寫），完整搬過來，外觀不變。
.filter {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;

  span {
    margin: 0px 10px;
    color: red;
    font-size: 18px;
    font-weight: bold;
  }
}

@media screen and (max-width: 1280px) {
  .filter {
    flex-direction: column;
  }
}
</style>
