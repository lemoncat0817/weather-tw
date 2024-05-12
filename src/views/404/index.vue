<template>
  <div class="box">
    <el-page-header style="width:  100%; height: 50px; font-size: 50px; font-weight: bold;" @back="goBack">
      <template #content>
        <span class="content"> 找不到此頁面，點擊返回並回到首頁 </span>
      </template>
    </el-page-header>
    <img class="errorImage" src="@/assets/404ERROR/404ERROR.png">
  </div>
</template>

<script setup lang="ts">
// 引入路由並使用
import { useRouter } from 'vue-router'
const router = useRouter()
const goBack = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.box {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .content {
    font-size: 30px;
  }

  .errorImage {
    width: 100%;
    height: 100%;
    position: absolute;
  }
}

// RWD
// 680px以下
@media screen and (max-width: 680px) {
  .box {
    .content {
      font-size: 20px;
    }
  }
}

// 480px以下
@media screen and (max-width: 480px) {
  .box {
    .content {
      font-size: 15px;
    }
  }
}

// 375px以下
@media screen and (max-width: 375px) {
  .box {
    .content {
      font-size: 12px;
    }
  }
}
</style>