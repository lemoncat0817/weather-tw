<template>
  <div>
    <!-- 選擇三個不同時段的菜單 -->
    <div class="menu">
      <el-menu default-active="1" mode="horizontal" align="center" style="margin: 20px 0px; border: none;">
        <el-menu-item style="width: 300px; font-size: 30px; border-bottom: 1px solid #666; "
          @click="thirtySixHoursStore.timePeriod = 0" index="1">{{
            getTimeLabel(0)
          }}</el-menu-item>
        <el-menu-item style="width: 300px; font-size: 30px; border-bottom: 1px solid #666; "
          @click="thirtySixHoursStore.timePeriod = 1" index="2">{{
            getTimeLabel(1)
          }}</el-menu-item>
        <el-menu-item style="width: 300px; font-size: 30px; border-bottom: 1px solid #666; "
          @click="thirtySixHoursStore.timePeriod = 2" index="3">{{
            getTimeLabel(2)
          }}</el-menu-item>
      </el-menu>
    </div>
    <!-- 三個時段的天氣預報卡片（同一份 markup，依 periods 陣列產生） -->
    <template v-for="(period, index) in periods" :key="index">
      <el-card style="margin: 40px 50px; border-radius: 20px; " v-if="thirtySixHoursStore.timePeriod === index">
        <el-tag class="tag">
          <div class="title" style="color:salmon;  font-weight: bold;">今明36小時內天氣預報</div>
          <div style="color:red; margin: 5px 0px;">此資料約每六小時更新一次</div>
          <div>{{ `預報時間: ${period.startTime} ~ ${period.endTime}` }}</div>
          <el-dropdown style="margin-top: 10px; ">
            <el-button class="toolBtn" type="warning">
              <div style="color: yellow;">搜尋你想查看縣市或篩選區域</div>
              <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu style="padding: 0; ">
                <el-card style="background: pink; ">
                  <!-- 搜尋功能 -->
                  <div class="search">
                    <span style="margin-right: 5px; color:red;  font-weight: bold;">搜尋縣市:</span>
                    <el-input size="small" v-model="thirtySixHoursStore.keyWord" placeholder="請輸入要查詢的縣市名稱"
                      style="width: 300px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; " class="icon">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                  <!-- 篩選功能 -->
                  <div class="filter">
                    <span style="color:red;  font-weight: bold;">依照縣市所在區域篩選:</span>
                    <span>北部:</span>
                    <el-switch v-model="thirtySixHoursStore.north" size="small" />
                    <span>中部:</span>
                    <el-switch v-model="thirtySixHoursStore.mid" size="small" />
                    <span>南部:</span>
                    <el-switch v-model="thirtySixHoursStore.south" size="small" />
                    <span>東部:</span>
                    <el-switch v-model="thirtySixHoursStore.east" size="small" />
                    <span>離島:</span>
                    <el-switch v-model="thirtySixHoursStore.out" size="small" />
                    <el-button style="margin-left: 10px;" type="primary" size="small"
                      @click="thirtySixHoursStore.resetFilter">重置篩選</el-button>
                  </div>
                </el-card>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tag>
        <thirtySixHoursWeatherTable :weather="searchWeather" :loading="loading"
          :timePeriod="thirtySixHoursStore.timePeriod" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
// 引入接口以及接口type
import { getThirtySixHoursWeatherForecast } from '@/apis/weatherForecast/index'
import type { thirtySixHoursWeatherData, location } from '@/apis/weatherForecast/type/thirtySixHours'
// 引入判斷當前時間的函式
import { getTimeLabel } from '@/utils/time'
// 引入地區篩選 composable
import { useRegionFilter } from '@/composables/useRegionFilter'
// 引入封裝的Table組件
import thirtySixHoursWeatherTable from './components/thirtySixHoursWeatherTable.vue'
// 引入倉庫
import { useThirtySixHoursStore } from '@/stores/weatherForecast/thirtySixHours'
const thirtySixHoursStore = useThirtySixHoursStore()
// 載入動畫
const loading = ref<boolean>(true)
// 接收當前天氣的資料
const weather = ref<location[]>([])
// 依縣市所在地區篩選（地區名單、filter computed、watch 都集中在 composable 裡）
const { filtered: filter } = useRegionFilter(
  weather,
  thirtySixHoursStore,
  (item) => item.locationName,
  { onRegionChange: () => reqThirtySixHoursWeatherForecast() }
)
// 分三階段的開始以及結束時間
const startTime1 = ref<string>('')
const endTime1 = ref<string>('')
const startTime2 = ref<string>('')
const endTime2 = ref<string>('')
const startTime3 = ref<string>('')
const endTime3 = ref<string>('')
// 三個時段各自的起訖時間，供模板 v-for 產生對應卡片
const periods = computed(() => [
  { startTime: startTime1.value, endTime: endTime1.value },
  { startTime: startTime2.value, endTime: endTime2.value },
  { startTime: startTime3.value, endTime: endTime3.value }
])
// 計算搜尋的天氣資料
const searchWeather = computed(() => {
  return weather.value.filter((item: any) => {
    if (thirtySixHoursStore.keyWord !== '') {
      return item.locationName.match(thirtySixHoursStore.keyWord)
    } else {
      return item
    }
  })
})
// 獲取當前天氣資料
const reqThirtySixHoursWeatherForecast = async () => {
  const res: thirtySixHoursWeatherData = await getThirtySixHoursWeatherForecast()
  weather.value = res.data.records.location
  startTime1.value = res.data.records.location[0].weatherElement[0].time[0].startTime
  endTime1.value = res.data.records.location[0].weatherElement[0].time[0].endTime
  startTime2.value = res.data.records.location[0].weatherElement[0].time[1].startTime
  endTime2.value = res.data.records.location[0].weatherElement[0].time[1].endTime
  startTime3.value = res.data.records.location[0].weatherElement[0].time[2].startTime
  endTime3.value = res.data.records.location[0].weatherElement[0].time[2].endTime
  if (thirtySixHoursStore.east || thirtySixHoursStore.south || thirtySixHoursStore.mid || thirtySixHoursStore.north || thirtySixHoursStore.out) {
    weather.value = filter.value
  }
  setTimeout(() => {
    loading.value = false
  }, 300)
}
// 刷新後渲染當前天氣資料
onMounted(() => {
  thirtySixHoursStore.timePeriod = 0
  reqThirtySixHoursWeatherForecast()
})
</script>

<style scoped lang="scss">
.el-menu {
  align-items: center;
  justify-content: center;
}

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

// RWD
// 1280以下
@media screen and (max-width: 1280px) {
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

// 680px以下
@media screen and (max-width: 680px) {
  .tag {
    div {
      font-size: 14px;
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

    div {
      font-size: 11px;
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
      font-size: 21px;
    }

    div {
      font-size: 10px;
    }
  }

  .search {

    span {
      font-size: 18px;
    }
  }
}

// 375px以下
@media screen and (max-width: 374px) {
  .tag {
    .title {
      font-size: 18px;
    }

    .toolBtn {
      width: 95%;

      div {
        font-size: 3vw;
      }
    }

    div {
      font-size: 2.4vw;
    }
  }
}
</style>