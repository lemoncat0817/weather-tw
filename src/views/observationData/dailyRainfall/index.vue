<template>
  <div>
    <el-card style=" margin: 40px 50px; border-radius: 20px; ">
      <el-tag class="tag">
        <div class="title" style="color:salmon;  font-weight: bold;">地面測站-每日雨量資料</div>
        <div style="color:red; margin: 5px 0px;">此資料約每一天的14:00更新一次</div>
        <el-dropdown style="margin-top: 10px; ">
          <el-button class="checkBtn" type="warning">
            <span style="color: yellow;">選擇你想查看的測量站</span>
            <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu style="padding: 0; ">
              <el-card style="background: pink; max-width: 700px;">
                <el-checkbox style="color: brown;" v-model="checkAll" :indeterminate="isIndeterminate"
                  @change="handleCheckAllChange">
                  全選
                </el-checkbox>
                <el-checkbox-group v-model="checkedStation" @change="handleCheckedStationChange">
                  <el-checkbox v-for="city in station" :key="city.StationName" :label="city.StationName"
                    :value="city.StationName" style="width: 50px;">
                    {{ city.StationName }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown style="margin-top: 10px; ">
          <el-button class="checkBtnRwd" type="warning">
            <span style="color: yellow;">查看測量站</span>
            <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu style="padding: 0; ">
              <el-card style="background: pink; max-width: 700px;">
                <el-checkbox style="color: brown;" v-model="checkAll" :indeterminate="isIndeterminate"
                  @change="handleCheckAllChange">
                  全選
                </el-checkbox>
                <el-checkbox-group v-model="checkedStation" @change="handleCheckedStationChange">
                  <el-checkbox v-for="city in station" :key="city.StationName" :label="city.StationName"
                    :value="city.StationName" style="width: 50px;">
                    {{ city.StationName }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tag>
      <el-table v-loading="loading" :data="filterStation" border max-height="calc(100vh - 365px)"
        style="width: 90%; margin: 20px auto; ">
        <el-table-column fixed prop="station.StationName" align="center" label="測量站名稱" min-width="95" />
        <template v-for="item in dailyRainfallLength" :key="item">
          <el-table-column align="center" width="150">
            <template #header>
              <div style="color:pink; font-size: 20px;">
                {{ dailyRainfall[0].stationObsTimes.stationObsTime[item - 1].Date }}
              </div>
            </template>
            <template #default="{ row }">
              <div v-if="row.stationObsTimes.stationObsTime[item - 1].weatherElements.Precipitation === 'X'">
                故障
              </div>
              <div v-if="row.stationObsTimes.stationObsTime[item - 1].weatherElements.Precipitation === 'T'">
                &lt; 0.5 mm
                <img src="@/assets/observationData/dailyRainFall/rain.png" alt="降雨量"
                  style="width: 20px; height: 20px; " />
              </div>
              <div v-else>{{ row.stationObsTimes.stationObsTime[item - 1].weatherElements.Precipitation }} mm
                <img src="@/assets/observationData/dailyRainFall/rain.png" alt="降雨量"
                  style="width: 20px; height: 20px; " />
              </div>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
// 引入接口和其類型
import { getDailyRainfallObservationData } from '@/apis/observationData/index'
import type { dailyRainfallData, StationData, Station } from '@/apis/observationData/type/dailyRainfall'
// 接收接口回傳的資料
const dailyRainfall = ref<StationData[]>([])
// 已有資料的長度
const dailyRainfallLength = ref<number>(0)
// 載入動畫
const loading = ref<boolean>(true)
// 選擇功能
const checkAll = ref<boolean>(false)
// 設定不確定狀態，僅負責樣式控制
const isIndeterminate = ref<boolean>(true)
// 裝接口回傳回來的測量站點的資料
const station = ref<Station[]>([])
// 存取全選後的選項
const checkedStation = ref<string[]>([])
// 根據傳入的布林值來控制是否將所有站點勾選上，同時清除不確定的狀態
const handleCheckAllChange = (val: boolean) => {
  checkedStation.value = val ? station.value.map(item => item.StationName) : []
  isIndeterminate.value = false
}
// 監聽勾選站點的變化
const handleCheckedStationChange = (value: string[]) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === station.value.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < station.value.length
}
// 計算勾選的站點並篩選出來
const filterStation = computed(() => {
  if (checkedStation.value) {
    return dailyRainfall.value.filter(item => checkedStation.value.includes(item.station.StationName))
  } else {
    return dailyRainfall.value
  }
})
// 請求接口資料
const reqdailyRainfall = async () => {
  const res: dailyRainfallData = await getDailyRainfallObservationData()
  dailyRainfall.value = res.data.records.location
  dailyRainfallLength.value = dailyRainfall.value[0].stationObsTimes.stationObsTime.length
  station.value = dailyRainfall.value.map(item => item.station)
  checkedStation.value = station.value.map(item => item.StationName)
  loading.value = false
}
// 刷新時渲染資料
onMounted(() => {
  reqdailyRainfall()
})
</script>

<style scoped lang="scss">
.tag {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  height: 100px;

  .title {
    font-size: 30px;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// RWD
// 480px以下
@media (max-width: 480px) {
  .tag {
    .title {
      font-size: 26px;
    }
  }
}

// 414px以下
@media (max-width: 414px) {
  .tag {
    font-size: 14px;

    .title {
      font-size: 22px;
    }
  }
}

// 375px以上
@media (min-width: 376px) {
  .tag {
    .checkBtnRwd {
      display: none;
    }
  }
}

// 375px以下
@media (max-width: 375px) {
  .tag {
    font-size: 12px;

    .title {
      font-size: 17px;
    }

    .checkBtn {
      display: none;
    }
  }
}
</style>