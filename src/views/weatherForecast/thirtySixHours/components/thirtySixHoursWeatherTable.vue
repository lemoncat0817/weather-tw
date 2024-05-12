<template>
  <el-table :data="weather" border max-height="calc(100vh - 465px)" style="width: 90%;  margin: 20px auto;"
    v-loading="loading">
    <!-- 縣市名稱 -->
    <el-table-column fixed label="縣市名稱" align="center" min-width="95">
      <template #default="{ row }">
        <span class="locationNameTitle" style="color: brown; font-weight: bold;">{{ row.locationName }}</span>
        <el-popover placement="right" :width="150" trigger="click">
          <template #reference>
            <el-button class="checkBtn" type="danger" icon="More"
              style="width: 30px; height: 30px; border-radius: 50%;"></el-button>
          </template>
          <template #default>
            <div class="locationName" @click="goThreeDays(row.locationName)" style="color:gray; font-size: 12px;">
              查看未來三天預報</div>
            <div class="locationName" @click="goWeek(row.locationName)" style="color:gray; font-size: 12px;">查看未來一週預報
            </div>
          </template>
        </el-popover>
      </template>
    </el-table-column>
    <!-- 天氣 -->
    <el-table-column label="天氣" align="center" width="260">
      <template #default="{ row }">
        <span>{{ row.weatherElement[0].time[timePeriod].parameter.parameterName }}</span>
      </template>
    </el-table-column>
    <!-- 降雨機率 -->
    <el-table-column label="降雨機率" width="150" align="center">
      <template #default="{ row }">
        <span>{{ ` ${row.weatherElement[1].time[timePeriod].parameter.parameterName}% ` }}</span>
        <img src="@/assets/weatherForecast/thirtySixHours/umbrella.png" alt="降雨機率" style="width: 20px; height: 20px;"
          v-if="row.weatherElement[1].time[timePeriod].parameter.parameterName > 0" />
      </template>
    </el-table-column>
    <!-- 氣溫 -->
    <el-table-column label="氣溫" width="200" align="center">
      <template #default="{ row }">
        <span>{{ ` ${row.weatherElement[2].time[timePeriod].parameter.parameterName} -
          ${row.weatherElement[4].time[timePeriod].parameter.parameterName}°C ` }}</span>
        <img src="@/assets/weatherForecast/thirtySixHours/temp.png" alt="溫度"
          style="width: 20px; height: 20px; background: chocolate; border-radius: 20px; ">
      </template>
    </el-table-column>
    <!-- 舒適度 -->
    <el-table-column label="舒適度" width="260" align="center">
      <template #default="{ row }">
        <span>{{ row.weatherElement[3].time[timePeriod].parameter.parameterName }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
// 引入倉庫
import { useThirtySixHoursStore } from '@/stores/weatherForecast/thirtySixHours'
const thirtySixHoursStore = useThirtySixHoursStore()
// 引入threeDays的關鍵字倉庫
import { useThreeDaysStore } from '@/stores/weatherForecast/threeDays'
const threeDaysStore = useThreeDaysStore()
// 引入week的關鍵字倉庫
import { useWeekStore } from '@/stores/weatherForecast/week'
const weekStore = useWeekStore()
// 引入並使用路由
import { onBeforeRouteLeave, useRouter } from 'vue-router'
const router = useRouter()
// 接收props
defineProps(['weather', 'loading', 'timePeriod'])
// 帶著關鍵字前往未來三天預報
const goThreeDays = (locationName: string) => {
  router.push('/weatherForecast/threeDays')
  threeDaysStore.keyWord = locationName
}
// 帶著關鍵字前往未來一週預報
const goWeek = (locationName: string) => {
  router.push('/weatherForecast/week')
  weekStore.keyWord = locationName
}
// 路由守衛
onBeforeRouteLeave((to, from, next) => {
  thirtySixHoursStore.keyWord = ''
  thirtySixHoursStore.resetFilter()
  next()
})
</script>

<style scoped lang="scss">
.locationName {
  color: gray;
  font-size: 12px;
  padding: 3px;
  border: 1px solid #666;
  border-radius: 20px;
  margin: 5px;
  cursor: pointer;

  &:hover {
    background: rgb(233, 233, 233);
  }
}

.locationNameTitle {
  font-size: 12px;
}
</style>