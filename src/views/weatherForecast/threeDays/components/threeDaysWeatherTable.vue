<template>
  <el-table v-loading="loading" :data="threeDaysWeather" border max-height="calc(100vh - 465px)"
    style="width: 90%; margin: 20px auto;">
    <!-- 縣市名稱 -->
    <el-table-column fixed="left" label="縣市名稱" align="center" min-width="95">
      <template #default="{ row }">
        <span class="locationNameTitle" style="  color: brown;  font-weight: bold;  ">
          {{ row.locationName }}
        </span>
        <el-popover placement="right" :width="150" trigger="click">
          <template #reference>
            <el-button class="checkBtn" type="danger" icon="More"
              style="width: 30px; height: 30px; border-radius: 50%;"></el-button>
          </template>
          <template #default>
            <div @click="goThirtySixHours(row.locationName)" class="locationName" style="color:gray; font-size: 12px;">
              查看36小時內預報</div>
            <div @click="goWeek(row.locationName)" class="locationName" style="color:gray; font-size: 12px;">查看未來一週預報
            </div>
          </template>
        </el-popover>
      </template>
    </el-table-column>
    <!-- 天氣 -->
    <el-table-column label="天氣" align="center" width="220">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent"
            v-if="row.weatherElement[1].time[item - 1].startTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  ">
              {{ `${row.weatherElement[1].time[item - 1].startTime?.slice(11, 13)}時` }}
            </div>
            <div style="width:145px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              row.weatherElement[1].time[item - 1].elementValue[0].value }}</div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 降雨機率 -->
    <el-table-column label="降雨機率" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 16" :key="item">
          <div class="tableContent"
            v-if="row.weatherElement[7].time[item - 1].startTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;   ">
              {{ `${row.weatherElement[7].time[item - 1].startTime?.slice(11, 13)}時` }}
            </div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[7].time[item - 1].elementValue[0].value}%` }}</div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 溫度 -->
    <el-table-column label="溫度" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent" v-if="row.weatherElement[3].time[item - 1].dataTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;   ">{{
              `${row.weatherElement[3].time[item - 1].dataTime?.slice(11, 13)}時` }}
            </div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[3].time[item - 1].elementValue[0].value}°C ` }}
            </div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 體感溫度 -->
    <el-table-column label="體感溫度" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent" v-if="row.weatherElement[2].time[item - 1].dataTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  ">{{
              `${row.weatherElement[2].time[item - 1].dataTime?.slice(11, 13)}時` }}</div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[2].time[item - 1].elementValue[0].value}°C ` }}</div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 相對濕度 -->
    <el-table-column label="相對濕度" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent" v-if="row.weatherElement[4].time[item - 1].dataTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  ">{{
              `${row.weatherElement[4].time[item - 1].dataTime?.slice(11, 13)}時` }}</div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[4].time[item - 1].elementValue[0].value}% ` }}</div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 舒適度指數 -->
    <el-table-column label="舒適度指數" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent" v-if="row.weatherElement[5].time[item - 1].dataTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  ">{{
              `${row.weatherElement[5].time[item - 1].dataTime?.slice(11, 13)}時` }}</div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[5].time[item - 1].elementValue[1].value} ` }}</div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 風速 -->
    <el-table-column label="風速" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent" v-if="row.weatherElement[8].time[item - 1].dataTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  ">{{
              `${row.weatherElement[8].time[item - 1].dataTime?.slice(11, 13)}時` }}</div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[8].time[item - 1].elementValue[0].value} m/s` }}
            </div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 風向 -->
    <el-table-column label="風向" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent" v-if="row.weatherElement[9].time[item - 1].dataTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  ">{{
              `${row.weatherElement[9].time[item - 1].dataTime?.slice(11, 13)}時` }}</div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[9].time[item - 1].elementValue[0].value} ` }}
            </div>
          </div>
        </template>
      </template>
    </el-table-column>
    <!-- 露點溫度 -->
    <el-table-column label="露點溫度" align="center" width="150">
      <template #default="{ row }">
        <template v-for="item in 32" :key="item">
          <div class="tableContent"
            v-if="row.weatherElement[10].time[item - 1].dataTime?.slice(8, 10) === `${getDate}`">
            <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  ">{{
              `${row.weatherElement[10].time[item - 1].dataTime?.slice(11, 13)}時` }}</div>
            <div style="width:100px ;font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">{{
              `${row.weatherElement[10].time[item - 1].elementValue[0].value}°C ` }}
            </div>
          </div>
        </template>
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
// props
defineProps(['loading', 'threeDaysWeather', 'getDate'])
// 帶著關鍵字前往36小時內預報
const goThirtySixHours = (locationName: string) => {
  router.push('/weatherForecast/thirtySixHours')
  thirtySixHoursStore.keyWord = locationName
}
// 帶著關鍵字前往未來一週預報
const goWeek = (locationName: string) => {
  router.push('/weatherForecast/week')
  weekStore.keyWord = locationName
}
// 路由守衛
onBeforeRouteLeave((to, from, next) => {
  threeDaysStore.keyWord = ''
  threeDaysStore.resetFilter()
  next()
})
</script>

<style scoped lang="scss">
.tableContent {
  display: flex;
  justify-content: center;
  align-items: center;

  div {
    width: 50px;
  }
}

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