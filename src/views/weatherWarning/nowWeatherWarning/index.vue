<template>
  <div>
    <el-card style=" margin: 40px 50px; border-radius: 20px; ">
      <el-tag class="tag">
        <div class="title" style="color:salmon;  font-weight: bold;">各別縣市地區目前天氣警報</div>
        <div style="color:red; margin: 5px 0px;">此資料不定期更新</div>
        <div class="content">資料內容包含(現象、警報或特報，開始時間，結束時間)</div>
        <div class="contentRwd">資料內容包含(現象、警報或特報，</div>
        <div class="contentRwd">開始時間，結束時間)</div>
        <el-dropdown style="margin-top: 10px; ">
          <el-button class="checkBtn" type="warning">
            <span style="color: yellow;">搜尋你想查看縣市或篩選區域</span>
            <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu style="padding: 0; ">
              <el-card style="background: pink; ">
                <!-- 搜尋功能 -->
                <div class="search">
                  <div class="centerSearch">
                    <span style="margin-right: 5px; color:red; font-size: 25px; font-weight: bold;">搜尋縣市:</span>
                    <el-input v-model="keyWord" placeholder="請輸入縣市名稱" style="width: 300px;" />
                    <el-icon style="border: 2px gray solid;  padding: 5px;  ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                </div>
                <!-- 篩選功能 -->
                <div class="filter">
                  <span style="color:red; font-size: 25px; font-weight: bold;">依照縣市所在區域篩選:</span>
                  <span>北部:</span>
                  <el-switch v-model="nowWeatherWarningStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="nowWeatherWarningStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="nowWeatherWarningStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="nowWeatherWarningStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="nowWeatherWarningStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="nowWeatherWarningStore.resetFilter">重置篩選</el-button>
                </div>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown style="margin-top: 10px; ">
          <el-button class="checkBtnRwd" type="warning">
            <span style="color: yellow;">搜尋/查看/篩選</span>
            <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu style="padding: 0; ">
              <el-card style="background: pink; ">
                <!-- 搜尋功能 -->
                <div class="search">
                  <span style="margin-right: 5px; color:red; font-size: 20px; font-weight: bold;">搜尋縣市:</span>
                  <el-input v-model="keyWord" placeholder="請輸入縣市名稱" style="width: 200px;" />
                  <el-icon style="border: 2px gray solid;  padding: 5px;  ">
                    <Search style="color: red;" />
                  </el-icon>
                </div>
                <!-- 篩選功能 -->
                <div class="filter">
                  <span style="color:red; font-size: 25px; font-weight: bold;">依照縣市所在區域篩選:</span>
                  <span>北部:</span>
                  <el-switch v-model="nowWeatherWarningStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="nowWeatherWarningStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="nowWeatherWarningStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="nowWeatherWarningStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="nowWeatherWarningStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="nowWeatherWarningStore.resetFilter">重置篩選</el-button>
                </div>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tag>
      <el-table v-loading="loading" :data="searchWeather" border max-height="calc(100vh - 385px)"
        style="width: 1060px; margin: 20px auto;">
        <!-- 縣市名稱 -->
        <el-table-column fixed label="縣市名稱" prop="locationName" align="center" min-width="80" />
        <!-- 現象 -->
        <el-table-column label="現象" align="center" width="300">
          <template #default="{ row }">
            <span style="color: red;font-size: 20px; font-weight: bolder;" v-if="row.hazardConditions.hazards[0]">{{
              row.hazardConditions.hazards[0].info.phenomena }}</span>
            <span v-if="!row.hazardConditions.hazards[0]">目前暫無警報或特報</span>
          </template>
        </el-table-column>
        <!-- 警報或特報 -->
        <el-table-column label="警報或特報" align="center" width="160">
          <template #default="{ row }">
            <div class="alarm" @click="goroute" style="color: red;font-size: 20px; font-weight: bolder;"
              v-if="row.hazardConditions.hazards[0]">{{
                row.hazardConditions.hazards[0].info.significance }}<span
                style="color: gray; font-size: 12px;">(點擊查看詳情)</span> </div>
            <span v-if="!row.hazardConditions.hazards[0]">目前暫無警報或特報</span>
          </template>
        </el-table-column>
        <!-- 開始時間 -->
        <el-table-column label="開始時間" align="center" width="200">
          <template #default="{ row }">
            <span style="color: red;font-size: 20px; font-weight: bolder;" v-if="row.hazardConditions.hazards[0]">{{
              row.hazardConditions.hazards[0].validTime.startTime
            }}</span>
            <span v-if="!row.hazardConditions.hazards[0]">目前暫無警報或特報</span>
          </template>
        </el-table-column>
        <!-- 結束時間 -->
        <el-table-column label="結束時間" align="center" width="200">
          <template #default="{ row }">
            <span style="color: red;font-size: 20px; font-weight: bolder;" v-if="row.hazardConditions.hazards[0]">{{
              row.hazardConditions.hazards[0].validTime.endTime }}</span>
            <span v-if="!row.hazardConditions.hazards[0]">目前暫無警報或特報</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
// 引入接口和其ts類型
import { getNowWeatherWarning } from '@/apis/weatherWarning/index'
import type { nowWeatherWarningData, LocationRecord } from '@/apis/weatherWarning/type/nowWeatherWarning'
// 引入路由
import { useRouter } from 'vue-router'
const router = useRouter()
const goroute = () => {
  router.push('/weatherWarning/weatherWarningContent')
}
// 引入並使用倉庫
import { useNowWeatherWarningStore } from '@/stores/weatherWarning/nowWeatherWarning'
const nowWeatherWarningStore = useNowWeatherWarningStore()
// 接收接口回傳的天氣警報
const nowWeatherWarning = ref<LocationRecord[]>([])
// 載入動畫
const loading = ref<boolean>(true)
// 引入東南西北地區
const north: string[] = ['臺北市', '新北市', '基隆市', '新竹市', '桃園市', '新竹縣', '宜蘭縣']
const mid: string[] = ['臺中市', '苗栗縣', '彰化縣', '南投縣', '雲林縣']
const south: string[] = ['高雄市', '臺南市', '嘉義市', '嘉義縣', '屏東縣']
const east: string[] = ['花蓮縣', '臺東縣']
const out: string[] = ['金門縣', '連江縣', '澎湖縣']
// 篩選區域
const filter = computed(() => {
  const filterByArea = (area: string[]) => nowWeatherWarning.value.filter(item => area.includes(item.locationName));

  let filteredWeather: LocationRecord[] = []

  if (nowWeatherWarningStore.east) {
    filteredWeather = filteredWeather.concat(filterByArea(east));
  }
  if (nowWeatherWarningStore.south) {
    filteredWeather = filteredWeather.concat(filterByArea(south));
  }
  if (nowWeatherWarningStore.mid) {
    filteredWeather = filteredWeather.concat(filterByArea(mid));
  }
  if (nowWeatherWarningStore.north) {
    filteredWeather = filteredWeather.concat(filterByArea(north));
  }
  if (nowWeatherWarningStore.out) {
    filteredWeather = filteredWeather.concat(filterByArea(out));
  }
  if (!nowWeatherWarningStore.east && !nowWeatherWarningStore.south && !nowWeatherWarningStore.mid && !nowWeatherWarningStore.north && !nowWeatherWarningStore.out) {
    reqNowWeatherWarning();
  }
  return filteredWeather
});
// 監聽使用者選擇的地區
watch(() =>
  [nowWeatherWarningStore.east, nowWeatherWarningStore.south, nowWeatherWarningStore.mid, nowWeatherWarningStore.north, nowWeatherWarningStore.out]
  , () => {
    nowWeatherWarning.value = filter.value
    reqNowWeatherWarning()

  })
// 接收使用者輸入的關鍵字
const keyWord = ref<string>('')
// 計算搜尋的天氣資料
const searchWeather = computed(() => {
  return nowWeatherWarning.value.filter((item: any) => {
    if (keyWord.value !== '') {
      return item.locationName.match(keyWord.value)
    } else {
      return item
    }
  })
})
// 獲取當前天氣警報
const reqNowWeatherWarning = async () => {
  const res: nowWeatherWarningData = await getNowWeatherWarning()
  nowWeatherWarning.value = res.data.records.location
  if (nowWeatherWarningStore.east || nowWeatherWarningStore.south || nowWeatherWarningStore.mid || nowWeatherWarningStore.north || nowWeatherWarningStore.out) {
    nowWeatherWarning.value = filter.value
  }
  setTimeout(() => {
    loading.value = false
  }, 500)
}
// 刷新後渲染當前天氣警報
onMounted(() => {
  reqNowWeatherWarning()
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

.search {
  display: flex;
  justify-content: center;
  align-items: center;
}

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

.alarm {
  cursor: pointer;
}

// RWD
// 1280px以下
@media screen and (max-width: 1280px) {
  .filter {
    flex-direction: column;
  }
}

// 680px以上
@media screen and (min-width: 681px) {
  .tag {
    .contentRwd {
      display: none;
    }

    .checkBtnRwd {
      display: none;
    }
  }
}

// 680px以下
@media screen and (max-width: 680px) {
  .tag {
    height: 140px;

    .title {
      font-size: 26px;
    }

    .content {
      display: none;
    }

    .checkBtn {
      display: none;
    }
  }
}

// 480px以下
@media screen and (max-width: 480px) {
  .tag {
    .title {
      font-size: 23px;
    }

    .content {
      display: none;
    }
  }
}

// 414px以下
@media screen and (max-width: 414px) {
  .tag {
    .title {
      font-size: 18px;
    }

    .contentRwd {
      font-size: 14px;
    }
  }
}

// 375px以下
@media screen and (max-width: 375px) {
  .tag {
    .title {
      font-size: 14px;
    }

    .contentRwd {
      font-size: 10px;
    }
  }
}
</style>