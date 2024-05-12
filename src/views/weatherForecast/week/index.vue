<template>
  <div>
    <!-- 渲染回傳的資料 -->
    <el-card style=" margin: 40px 50px; border-radius: 20px; ">
      <el-tag class="tag">
        <div class="title" style="color:salmon;  font-weight: bold;">未來一週天氣預報</div>
        <div style="color:red; margin: 5px 0px;">此資料約每六小時更新一次</div>
        <div class="folder">資料內容包含(天氣、降雨機率、溫度、平均溫度、體感溫度、平均相對濕度、最小及最大舒適度指數、最大風速、風向，平均露點溫度)</div>
        <div class="rwdDiv">資料內容包含(天氣、降雨機率、溫度、平均溫度、體感溫度、</div>
        <div class="rwdDiv">平均相對濕度、最小及最大舒適度指數、最大風速、風向，平均露點溫度)</div>
        <div>
          <el-dropdown style=" margin-top: 10px; ">
            <el-button class="toolBtn" type="warning">
              <div style="color: yellow;">選擇或搜尋你想查看縣市</div>
              <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu style="padding: 0; ">
                <el-card class="card" style="width: 100%; background: pink; ">
                  <!-- 搜尋功能 -->
                  <div class="search">
                    <span style="margin-right: 5px; color:red;  font-weight: bold;">搜尋縣市:</span>
                    <el-input size="small" v-model="weekStore.keyWord" placeholder="請輸入縣市名稱" style="width: 300px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; " class="icon">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                  <!-- 篩選功能 -->
                  <div class="filter">
                    <span style="color:red;  font-weight: bold;">依照縣市所在區域篩選:</span>
                    <span>北部:</span>
                    <el-switch v-model="weekStore.north" size="small" />
                    <span>中部:</span>
                    <el-switch v-model="weekStore.mid" size="small" />
                    <span>南部:</span>
                    <el-switch v-model="weekStore.south" size="small" />
                    <span>東部:</span>
                    <el-switch v-model="weekStore.east" size="small" />
                    <span>離島:</span>
                    <el-switch v-model="weekStore.out" size="small" />
                    <el-button style="margin-left: 10px;" type="primary" size="small"
                      @click="weekStore.resetFilter">重置篩選</el-button>
                  </div>
                </el-card>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-tag>
      <el-table :data="searchWeather" border max-height="calc(100vh - 385px)" style="width: 90%; margin: 20px auto;  "
        v-loading="loading">
        <!-- 縣市名稱 -->
        <el-table-column fixed="left" align="center" min-width="95" label="縣市名稱">
          <template #default="{ row }">
            <span class="locationNameTitle" style="  color: brown;  font-weight: bold;  ">{{ row.locationName }}</span>
            <el-popover placement="right" :width="150" trigger="click">
              <template #reference>
                <el-button class="checkBtn" type="danger" icon="More"
                  style="width: 30px; height: 30px; border-radius: 50%;"></el-button>
              </template>
              <template #default>
                <div @click="goThirtySixHours(row.locationName)" class="locationName"
                  style="color:gray; font-size: 12px;">查看36小時內預報</div>
                <div @click="goThreeDays(row.locationName)" class="locationName" style="color:gray; font-size: 12px;">
                  查看未來三天預報</div>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <template v-for="item in 14" :key="item">
          <el-table-column align="center" width="425">
            <template #header>
              <div class="text-center"
                v-if="weekWeather.length > 0 && weekWeather[0].weatherElement[1].time[item - 1].startTime">
                <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray; ">
                  {{ `日期: ${weekWeather[0].weatherElement[1].time[item - 1].startTime?.slice(5, 7)}
                  /${weekWeather[0].weatherElement[1].time[item - 1].startTime?.slice(8, 10)}` }}
                </div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; ">
                  {{ `時間: ${weekWeather[0].weatherElement[1].time[item - 1].startTime?.slice(11, 16)}` }}
                </div>
              </div>
            </template>
            <template #default="{ row }">
              <!-- 天氣 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  天氣:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ row.weatherElement[6].time[item - 1].elementValue[0].value }}
                </div>
              </div>
              <!-- 降雨機率 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  降雨機率:</div>
                <div v-if="row.weatherElement[0].time[item - 1].elementValue[0].value !== ' '"
                  style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[0].time[item - 1].elementValue[0].value}%` }}
                </div>
                <div v-else style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  暫無資料
                </div>
              </div>
              <!-- 溫度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  溫度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[8].time[item - 1].elementValue[0].value}°C -
                  ${row.weatherElement[12].time[item - 1].elementValue[0].value}°C ` }}
                </div>
              </div>
              <!-- 平均溫度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  平均溫度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[1].time[item - 1].elementValue[0].value}°C ` }}
                </div>
              </div>
              <!-- 體感溫度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  體感溫度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[11].time[item - 1].elementValue[0].value}°C -
                  ${row.weatherElement[5].time[item - 1].elementValue[0].value}°C` }}
                </div>
              </div>
              <!-- 平均相對濕度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  平均相對濕度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[2].time[item - 1].elementValue[0].value}% ` }}
                </div>
              </div>
              <!-- 最小舒適度指數 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  最小舒適度指數:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ row.weatherElement[3].time[item - 1].elementValue[1].value }}
                </div>
              </div>
              <!-- 最大舒適度指數 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  最大舒適度指數:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ row.weatherElement[7].time[item - 1].elementValue[1].value }}
                </div>
              </div>
              <!-- 最大風速 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  最大風速:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[4].time[item - 1].elementValue[0].value} m/s ` }}
                </div>
              </div>
              <!-- 風向 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  風向:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[13].time[item - 1].elementValue[0].value} ` }}
                </div>
              </div>
              <!-- 平均露點溫度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  平均露點溫度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[14].time[item - 1].elementValue[0].value}°C ` }}
                </div>
              </div>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
// 引入接口以及接口type
import { getWeekWeatherForecast } from '@/apis/weatherForecast/index'
import type { weekWeatherData, Location } from '@/apis/weatherForecast/type/week'
// 引入倉庫
import { useWeekStore } from '@/stores/weatherForecast/week'
const weekStore = useWeekStore()
// 引入thirtySixHours的關鍵字倉庫
import { useThirtySixHoursStore } from '@/stores/weatherForecast/thirtySixHours'
const thirtySixHoursStore = useThirtySixHoursStore()
// 引入threeDays的關鍵字倉庫
import { useThreeDaysStore } from '@/stores/weatherForecast/threeDays'
const threeDaysStore = useThreeDaysStore()
// 引入並使用路由
import { onBeforeRouteLeave, useRouter } from 'vue-router'
const router = useRouter()
// 帶著關鍵字前往36小時內預報
const goThirtySixHours = (locationName: string) => {
  router.push('/weatherForecast/thirtySixHours')
  thirtySixHoursStore.keyWord = locationName
}
// 帶著關鍵字前往未來一週預報
const goThreeDays = (locationName: string) => {
  router.push('/weatherForecast/threeDays')
  threeDaysStore.keyWord = locationName
}
// 路由守衛
onBeforeRouteLeave((to, from, next) => {
  weekStore.keyWord = ''
  weekStore.resetFilter()
  next()
})
// 接收接口回傳的天氣資料
const weekWeather = ref<Location[]>([])
// 引入東南西北地區
const north: string[] = ['臺北市', '新北市', '基隆市', '新竹市', '桃園市', '新竹縣', '宜蘭縣']
const mid: string[] = ['臺中市', '苗栗縣', '彰化縣', '南投縣', '雲林縣']
const south: string[] = ['高雄市', '臺南市', '嘉義市', '嘉義縣', '屏東縣']
const east: string[] = ['花蓮縣', '臺東縣']
const out: string[] = ['金門縣', '連江縣', '澎湖縣']
// 篩選區域
const filter = computed(() => {
  const filterByArea = (area: string[]) => weekWeather.value.filter(item => area.includes(item.locationName));

  let filteredWeather: Location[] = []

  if (weekStore.east) {
    filteredWeather = filteredWeather.concat(filterByArea(east));
  }
  if (weekStore.south) {
    filteredWeather = filteredWeather.concat(filterByArea(south));
  }
  if (weekStore.mid) {
    filteredWeather = filteredWeather.concat(filterByArea(mid));
  }
  if (weekStore.north) {
    filteredWeather = filteredWeather.concat(filterByArea(north));
  }
  if (weekStore.out) {
    filteredWeather = filteredWeather.concat(filterByArea(out));
  }
  if (!weekStore.east && !weekStore.south && !weekStore.mid && !weekStore.north && !weekStore.out) {
    return weekWeather.value
  }
  return filteredWeather
});
// 監聽使用者選擇的地區
watch(async () =>
  [weekStore.east, weekStore.south, weekStore.mid, weekStore.north, weekStore.out]
  , () => {
    weekWeather.value = filter.value
    reqWeekWeatherForecast()
  })

// 計算搜尋的天氣資料
const searchWeather = computed(() => {
  return weekWeather.value.filter((item: any) => {
    if (weekStore.keyWord !== '') {
      return item.locationName.match(weekStore.keyWord)
    } else {
      return item
    }
  })
})
// 請求的縣市Id
const locationId = ref<string>('F-D0047-065')
// 監聽縣市Id是否改變
watch(locationId, () => {
  reqWeekWeatherForecast()
})
// 載入動畫
const loading = ref<boolean>(true)
// 獲取當前天氣資料
const reqWeekWeatherForecast = async () => {
  const res: weekWeatherData = await getWeekWeatherForecast()
  weekWeather.value = res.data.records.locations[0].location
  if (weekStore.east || weekStore.south || weekStore.mid || weekStore.north || weekStore.out) {
    weekWeather.value = filter.value
  }
  loading.value = false
}
// 刷新後渲染當前天氣資料
onMounted(() => {
  reqWeekWeatherForecast()
})
</script>

<style scoped lang="scss">
.tag {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  height: 120px;

  .title {
    font-size: 30px;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}


.text-center {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 400px;

  div {
    width: 200px;
    height: 30px;
    line-height: 30px;
  }
}

.search {
  display: flex;
  justify-content: center;
  align-items: center;

  span {
    margin: 0px 10px;
    color: red;
    font-size: 26px;
    font-weight: bold;
  }
}

.filter {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;

  span {
    margin: 0px 5px;
    color: red;
    font-size: 24px;
    font-weight: bold;
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

// RWD
// 1366以下
@media screen and (max-width: 1366px) {
  .tag {
    div {
      font-size: 14.5px;
    }
  }

}

// 1280px以下
@media screen and (max-width: 1280px) {
  .tag {
    div {
      font-size: 9.5px;
    }
  }

  .search {
    span {
      font-size: 22px;
    }
  }

  .filter {
    span {
      font-size: 14px;
    }
  }
}

// 980以上
@media screen and (min-width: 981px) {
  .tag {
    .rwdDiv {
      display: none;
    }
  }
}

// 980px以下
@media screen and (max-width: 980px) {
  .tag {
    height: 130px;

    .title {
      font-size: 24px;
    }

    div {
      font-size: 13px;
    }

    .rwdDiv {
      font-size: 16px;
    }

    .folder {
      display: none;
    }
  }
}

// 918px以下
@media screen and (max-width: 918px) {
  .tag {
    height: 130px;

    .title {
      font-size: 24px;
    }

    div {
      font-size: 13px;
    }

    .rwdDiv {
      font-size: 13px;
    }

    .folder {
      display: none;
    }
  }
}

// 680px以下
@media screen and (max-width: 680px) {
  .tag {
    div {
      font-size: 14px;
    }

    .rwdDiv {
      font-size: 10px;
    }
  }


  .search {
    span {
      font-size: 22px;
    }
  }

  .filter {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    span {
      font-size: 20px;
    }
  }
}

// 480px以下
@media screen and (max-width: 480px) {
  .tag {
    .title {
      font-size: 26px;
    }

    .toolBtn {
      height: 20px;
    }

    div {
      font-size: 14px;
    }

    .rwdDiv {
      font-size: 8px;
    }
  }

  .search {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .icon {
      display: none;
    }

    span {
      font-size: 20px;
    }
  }
}

// 414px以下
@media screen and (max-width: 414px) {
  .tag {
    .title {
      font-size: 24px;
    }

    .toolBtn {
      height: 15px;

      div {
        font-size: 3vw;
      }
    }

    .rwdDiv {
      font-size: 7px;
    }

    div {
      font-size: 8px;
    }
  }

  .search {

    span {
      font-size: 18px;
    }
  }
}

// 374px以下
@media screen and (max-width: 374px) {
  .tag {
    .title {
      font-size: 18px;
    }

    .toolBtn {
      height: 15px;

      div {
        font-size: 3vw;
      }
    }

    .rwdDiv {
      font-size: 7px;
    }


    div {
      font-size: 8px;
    }
  }
}

// 363px以下
@media screen and (max-width: 363px) {
  .tag {
    .title {
      font-size: 18px;
    }

    .toolBtn {
      height: 15px;
      width: 85%;

      div {
        font-size: 2.8vw;
      }
    }

    .rwdDiv {
      font-size: 5px;
    }


    div {
      font-size: 8px;
    }
  }
}
</style>