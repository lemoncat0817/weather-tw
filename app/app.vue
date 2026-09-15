<template>
  <!-- 全站唯一的導覽回饋：大多數頁面用 top-level await useFetch，換頁時新頁面要等資料
       抓回來才會掛載（Nuxt 的 Suspense 邊界），舊頁面畫面在那之前完全不會變——沒有這條
       進度條，使用者在慢網路下點了連結會像「沒反應」，不知道網頁是不是壞了 -->
  <NuxtLoadingIndicator color="#38bdf8" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
