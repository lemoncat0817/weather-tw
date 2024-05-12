<template>
  <div>
    <el-card v-for="item in weatherWarningContent" :key="item">
      <div v-if="item" class="warning">
        <div class="title">{{ item.datasetInfo.datasetDescription }}</div>
        <div class="location">
          <div style="color:brown; font-weight: bold;">警報地區:</div>
          <template v-for="item2 in item.hazardConditions?.hazards?.hazard " :key="item2">
            <template v-for="(item3, index) in item2.info?.affectedAreas?.location" :key=item3>
              <div class="locationName">{{ item3.locationName }}</div>
              <div style="color:brown; " v-if="!(index + 1 === item2.info?.affectedAreas?.location?.length)">、</div>
            </template>
          </template>
        </div>
        <div class="startAndEndAndissueAndUpdateTime">
          <div style="color: gray;">發布時間:{{ item.datasetInfo.issueTime }}</div>
          <div style="color: red;">更新時間:{{ item.datasetInfo.update }}</div>
          <div style="color: tomato;">開始時間:{{ item.datasetInfo.validTime.startTime }}</div>
          <div style="color: tomato;">結束時間:{{ item.datasetInfo.validTime.endTime }}</div>
        </div>
        <div class="content" style="color: blueviolet;">特報或警報內容:{{ item.contents.content.contentText
          }}</div>
      </div>
      <div v-else class="warning">目前暫時無警報或特報</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// 引入接口和其ts類型
import { getWeatherWarningContent } from '@/apis/weatherWarning/index'
import type { weatherWarningContentData, Record } from '@/apis/weatherWarning/type/weatherWarningContent'
// 接收接口回傳的天氣警報
const weatherWarningContent = ref<Record[]>([])
const locationNameLength = ref()
// 載入動畫
const loading = ref<boolean>(true)
// 獲取當前天氣警報
const reqweatherWarningContent = async () => {
  const res: weatherWarningContentData = await getWeatherWarningContent()
  weatherWarningContent.value = res.data.records.record
  setTimeout(() => {
    loading.value = false
  }, 500)
}
// 刷新後渲染當前天氣警報
onMounted(() => {
  reqweatherWarningContent()
})
</script>

<style scoped lang="scss">
.el-card {
  margin: 20px auto;
  width: calc(100% - 100px);
  background: wheat;
  border-radius: 30px;
}

.warning {
  .title {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 20px;
    color: blue;
  }

  .location {
    display: flex;

    .locationName {
      margin: 0px 5px;
      font-size: 18px;
      color: royalblue;
      font-weight: bold;
    }
  }

  .startAndEndAndissueAndUpdateTime {
    display: flex;
    align-items: center;
    justify-self: center;
    margin-bottom: 10px;

    div {
      margin: 15px;
      font-size: 16px;
    }
  }

  .content {
    font-size: 24px;
    margin-bottom: 20px;
  }
}

// RWD
// 980px以下
@media (max-width: 980px) {
  .el-card {
    width: calc(100% - 60px);
  }

}

// 768px以下
@media (max-width: 768px) {
  .el-card {
    width: calc(100% - 20px);
  }

  .startAndEndAndissueAndUpdateTime {
    flex-direction: column;
  }
}

// 480px以下
@media (max-width: 480px) {
  .location {
    flex-direction: column;
  }
}
</style>