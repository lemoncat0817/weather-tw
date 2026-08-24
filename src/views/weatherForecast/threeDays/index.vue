<template>
  <div>
    <!-- 選擇三個不同時段的菜單 -->
    <el-menu default-active="1" mode="horizontal" align="center" style="margin: 20px 0px; border: none;">
      <el-menu-item style="width: 300px; font-size: 30px; border-bottom: 1px solid #666;"
        @click="threeDaysStore.timePeriod = 0" index="1">{{
          getDay(1)
        }}</el-menu-item>
      <el-menu-item style="width: 300px; font-size: 30px; border-bottom: 1px solid #666;"
        @click="threeDaysStore.timePeriod = 1" index="2">{{
          getDay(2)
        }}</el-menu-item>
      <el-menu-item style="width: 300px; font-size: 30px; border-bottom: 1px solid #666;"
        @click="threeDaysStore.timePeriod = 2" index="3">{{
          getDay(3)
        }}</el-menu-item>
    </el-menu>
    <!-- 三個時段的天氣預報卡片（同一份 markup，依 periods 陣列產生） -->
    <template v-for="(period, index) in periods" :key="index">
      <el-card style=" margin: 40px 50px; border-radius: 20px; " v-if="threeDaysStore.timePeriod === index">
        <el-tag class="tag">
          <div class="title" style="color:salmon; font-weight: bold;">未來三天天氣預報</div>
          <div style="color:red; margin: 5px 0px;">此資料約每六小時更新一次</div>
          <div>資料內容包含(天氣、降雨機率、溫度、體感溫度、相對濕度、舒適度指數、風速、風向，露點溫度)</div>
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
                    <span style="margin-right: 5px; color:red; font-weight: bold;">搜尋縣市:</span>
                    <el-input size="small" v-model="threeDaysStore.keyWord" placeholder="請輸入縣市名稱" style="width: 300px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; " class="icon">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                  <!-- 篩選功能 -->
                  <div class="filter">
                    <span style="color:red;  font-weight: bold;">依照縣市所在區域篩選:</span>
                    <span>北部:</span>
                    <el-switch v-model="threeDaysStore.north" size="small" />
                    <span>中部:</span>
                    <el-switch v-model="threeDaysStore.mid" size="small" />
                    <span>南部:</span>
                    <el-switch v-model="threeDaysStore.south" size="small" />
                    <span>東部:</span>
                    <el-switch v-model="threeDaysStore.east" size="small" />
                    <span>離島:</span>
                    <el-switch v-model="threeDaysStore.out" size="small" />
                    <el-button style="margin-left: 10px;" type="primary" size="small"
                      @click="threeDaysStore.resetFilter">重置篩選</el-button>
                  </div>
                </el-card>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tag>
        <threeDaysWeatherTable :loading="loading" :threeDaysWeather="searchWeather" :getDate="period.date" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// 引入接口以及接口type
import { getThreeDaysWeatherForecast } from '@/apis/weatherForecast/index'
import type { threeDaysWeatherData, Location } from '@/apis/weatherForecast/type/threeDays'
// 引入判斷當前日期的函式
import { getDay, getDate } from '@/utils/date'
// 引入地區篩選 composable
import { useRegionFilter } from '@/composables/useRegionFilter'
// 引入封裝的Table組件
import threeDaysWeatherTable from './components/threeDaysWeatherTable.vue'
// 引入倉庫
import { useThreeDaysStore } from '@/stores/weatherForecast/threeDays'
const threeDaysStore = useThreeDaysStore()
// 載入動畫
const loading = ref<boolean>(true)
// 接收當前天氣的資料
const threeDaysWeather = ref<Location[]>([])
// 依縣市所在地區篩選（地區名單、filter computed、watch 都集中在 composable 裡）
const { filtered: filter } = useRegionFilter(
  threeDaysWeather,
  threeDaysStore,
  (item) => item.locationName,
  { onRegionChange: () => reqThreeDaysWeatherForecast() }
)
// 三個時段各自的日期字串，供模板 v-for 產生對應卡片
const periods = computed(() => [1, 2, 3].map((offset) => ({ date: getDate(offset) })))
// 接收使用者輸入的關鍵字
// 計算搜尋的天氣資料
const searchWeather = computed(() => {
  return threeDaysWeather.value.filter((item: any) => {
    if (threeDaysStore.keyWord !== '') {
      return item.locationName.match(threeDaysStore.keyWord)
    } else {
      return item
    }
  })
})
// 獲取當前天氣資料
const reqThreeDaysWeatherForecast = async () => {
  const res: threeDaysWeatherData = await getThreeDaysWeatherForecast()
  threeDaysWeather.value = res.data.records.locations[0].location
  if (threeDaysStore.east || threeDaysStore.south || threeDaysStore.mid || threeDaysStore.north || threeDaysStore.out) {
    threeDaysWeather.value = filter.value
  }
  loading.value = false
}
// 刷新後渲染當前天氣資料
onMounted(() => {
  reqThreeDaysWeatherForecast()
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
// 1280px以下
@media screen and (max-width: 1280px) {
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
    span {
      font-size: 14px;
    }
  }
}

// 980px以下
@media screen and (max-width: 980px) {
  .tag {
    .title {
      font-size: 24px;
    }

    div {
      font-size: 9.5px;
    }
  }
}

// 680px以下
@media screen and (max-width: 680px) {
  .tag {
    div {
      font-size: 7.5px;
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

      div {
        font-size: 3vw;
      }
    }

    div {
      font-size: 6px;
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

    div {
      font-size: 5px;
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

    div {
      font-size: 5px;
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

    div {
      font-size: 4px;
    }
  }
}
</style>