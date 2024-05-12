<template>
  <div>
    <!-- 渲染回傳的資料 -->
    <el-card style=" margin: 40px 50px; border-radius: 20px; ">
      <el-tag class="tag">
        <div class="title" style="color:salmon;   font-weight: bold;">全臺灣各鄉鎮市區預報 - {{ location }}</div>
        <div style="color:red; margin: 5px 0px;">此資料約每六小時更新一次</div>
        <div class="folder">資料內容包含(天氣、降雨機率、溫度、體感溫度、相對濕度、舒適度指數、風速、風向，露點溫度)</div>
        <div class="rwdDiv">資料內容包含(天氣、降雨機率、溫度、體感溫度、</div>
        <div class="rwdDiv">、相對濕度、舒適度指數、風速、風向，露點溫度)</div>
        <div>
          <el-dropdown style=" margin-top: 10px; ">
            <el-button type="warning" class="toolBtn">
              <span style="color: yellow;">選擇你想查看縣市以及搜尋該縣市的鄉鎮市區</span>
              <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu style="padding: 0; ">
                <!-- 選擇要查看的縣市 -->
                <el-card class="card" style="width: 100%; background: pink; ">
                  <div class="northMid">
                    <div class="north">
                      <div>北部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-061" size="large">臺北市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-069" size="large">新北市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-049" size="large">基隆市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-053" size="large">新竹市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-005" size="large">桃園市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-009" size="large">新竹縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-001" size="large">宜蘭縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="mid">
                      <div>中部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-073" size="large">臺中市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-013" size="large">苗栗縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-017" size="large">彰化縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-021" size="large">南投縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-025" size="large">雲林縣</el-radio>
                      </el-radio-group>
                    </div>
                  </div>
                  <div class="southEastOut">
                    <div class="south">
                      <div>南部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-065" size="large">高雄市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-077" size="large">臺南市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-057" size="large">嘉義市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-029" size="large">嘉義縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-033" size="large">屏東縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="east">
                      <div>東部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-041" size="large">花蓮縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-037" size="large">臺東縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="out">
                      <div>離島:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-085" size="large">金門縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-081" size="large">連江縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-045" size="large">澎湖縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="search">
                      <div>搜尋鄉鎮市區:</div>
                      <div class="districtSearch"> <el-input v-model="allTaiwanStore.districtKeyword"
                          placeholder="請輸入鄉鎮市區" style="width: 120px;" />
                        <el-icon style="border: 2px gray solid ; padding: 5px; ">
                          <Search />
                        </el-icon>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown style=" margin-top: 10px; ">
            <el-button type="warning" class="toolBtnRwd">
              <span style="color: yellow;">查看/搜尋</span>
              <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu style="padding: 0; ">
                <!-- 選擇要查看的縣市 -->
                <el-card class="card" style="width: 100%; background: pink; ">
                  <div class="northMid">
                    <div class="north">
                      <div>北部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-061" size="large">臺北市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-069" size="large">新北市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-049" size="large">基隆市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-053" size="large">新竹市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-005" size="large">桃園市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-009" size="large">新竹縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-001" size="large">宜蘭縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="mid">
                      <div>中部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-073" size="large">臺中市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-013" size="large">苗栗縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-017" size="large">彰化縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-021" size="large">南投縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-025" size="large">雲林縣</el-radio>
                      </el-radio-group>
                    </div>
                  </div>
                  <div class="southEastOut">
                    <div class="south">
                      <div>南部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-065" size="large">高雄市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-077" size="large">臺南市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-057" size="large">嘉義市</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-029" size="large">嘉義縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-033" size="large">屏東縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="east">
                      <div>東部:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-041" size="large">花蓮縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-037" size="large">臺東縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="out">
                      <div>離島:</div>
                      <el-radio-group v-model="allTaiwanStore.locationId">
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-085" size="large">金門縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-081" size="large">連江縣</el-radio>
                        <el-radio style="margin: 0px 3px; color:brown;" value="F-D0047-045" size="large">澎湖縣</el-radio>
                      </el-radio-group>
                    </div>
                    <div class="search">
                      <div>搜尋鄉鎮市區:</div>
                      <div class="districtSearch"> <el-input v-model="allTaiwanStore.districtKeyword"
                          placeholder="請輸入鄉鎮市區" style="width: 120px;" />
                        <el-icon style="border: 2px gray solid ; padding: 5px; ">
                          <Search />
                        </el-icon>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-tag>
      <el-table :data="searchWeather" border max-height="calc(100vh - 385px)" style="width: 90%; margin: 20px auto; "
        v-loading="loading">
        <!-- 鄉鎮名稱 -->
        <el-table-column fixed="left" align="center" min-width="105" label="鄉鎮名稱">
          <template #default="{ row }">
            <span class="locationNameTitle" style="  color: brown;  font-weight: bold; ">{{ row.locationName }}</span>
            <el-popover placement="right" :width="150" trigger="click">
              <template #reference>
                <el-button class="checkBtn" type="danger" icon="More"
                  style="width: 30px; height: 30px; border-radius: 50%;"></el-button>
              </template>
              <template #default>
                <div @click="goAllTaiwanWeek(row.locationName)" class="locationName"
                  style="color:gray; font-size: 12px;">查看未來一週預報</div>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <template v-for="item in 32" :key="item">
          <el-table-column align="center" width="275">
            <template #header>
              <div class="text-center"
                v-if="allTaiwanWeather.length > 0 && allTaiwanWeather[0].weatherElement[1].time[item - 1].startTime">
                <div style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray; ">
                  {{ `日期: ${allTaiwanWeather[0].weatherElement[1].time[item - 1].startTime?.slice(5, 7)}
                  /${allTaiwanWeather[0].weatherElement[1].time[item - 1].startTime?.slice(8, 10)}` }}
                </div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; ">
                  {{ `時間: ${allTaiwanWeather[0].weatherElement[1].time[item - 1].startTime?.slice(11, 16)}` }}
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
                  {{ row.weatherElement[1].time[item - 1].elementValue[0].value }}
                </div>
              </div>
              <!-- 降雨機率 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  降雨機率:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[7].time[Math.ceil(item / 2) - 1].elementValue[0].value}%` }}
                </div>
              </div>
              <!-- 溫度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  溫度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[3].time[item - 1].elementValue[0].value}°C ` }}
                </div>
              </div>
              <!-- 體感溫度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  體感溫度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[2].time[item - 1].elementValue[0].value}°C ` }}
                </div>
              </div>
              <!-- 相對濕度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  相對濕度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[4].time[item - 1].elementValue[0].value}% ` }}
                </div>
              </div>
              <!-- 舒適度指數 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  舒適度指數:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ row.weatherElement[5].time[item - 1].elementValue[1].value }}
                </div>
              </div>
              <!-- 風速 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  風速:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[8].time[item - 1].elementValue[0].value} m/s ` }}
                </div>
              </div>
              <!-- 風向 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  風向:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[9].time[item - 1].elementValue[0].value} ` }}
                </div>
              </div>
              <!-- 露點溫度 -->
              <div class="text-center">
                <div
                  style="color: palevioletred; font-size: 14px; font-weight: bold; border: 1px solid gray;  border-right: 0px;">
                  露點溫度:</div>
                <div style="font-size: 14px; border: 1px solid gray; color: royalblue; border-left: 0px;">
                  {{ `${row.weatherElement[10].time[item - 1].elementValue[0].value}°C ` }}
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
import { getAllTaiwanWeatherForecast } from '@/apis/weatherForecast/index'
import type { allTaiwanWeatherData, Location } from '@/apis/weatherForecast/type/allTaiwan'
// 引入倉庫並使用
import { useAllTaiwanStore } from '@/stores/weatherForecast/allTaiwan'
const allTaiwanStore = useAllTaiwanStore()
// 引入allTaiwanWeek倉庫並使用
import { useAllTaiwanWeekStore } from '@/stores/weatherForecast/allTaiwanWeek'
const allTaiwanWeekStore = useAllTaiwanWeekStore()
// 引入並使用路由
import { onBeforeRouteLeave, useRouter } from 'vue-router'
const router = useRouter()
// 帶著關鍵字前往未來一週預報
const goAllTaiwanWeek = (locationName: string) => {
  router.push('/weatherForecast/allTaiwanWeek')
  allTaiwanWeekStore.districtKeyword = locationName
  allTaiwanWeekStore.locationId = allTaiwanStore.locationId.slice(0, 9) + ((parseInt(allTaiwanStore.locationId.slice(9, 11)) + 2) < 10 ? '0' +
    (parseInt(allTaiwanStore.locationId.slice(9, 11)) + 2).toString() : (parseInt(allTaiwanStore.locationId.slice(9,
      11)) + 2).toString())
}
// 監聽縣市Id是否改變
watch(() => allTaiwanStore.locationId, () => {
  reqAllTaiwanWeatherForecast(allTaiwanStore.locationId)
})
// 路由守衛
onBeforeRouteLeave((to, from, next) => {
  allTaiwanStore.districtKeyword = ''
  next()
})
// 接收接口回傳的資料的縣市歸屬
const location = ref<string>('')
// 接收接口回傳的天氣資料
const allTaiwanWeather = ref<Location[]>([])
// 計算搜尋的天氣資料
const searchWeather = computed(() => {
  return allTaiwanWeather.value.filter((item: any) => {
    if (allTaiwanStore.districtKeyword !== '') {
      return item.locationName.match(allTaiwanStore.districtKeyword)
    } else {
      return item
    }
  })
})
// 載入動畫
const loading = ref<boolean>(true)
// 獲取當前天氣資料
const reqAllTaiwanWeatherForecast = async (locationId: string) => {
  const res: allTaiwanWeatherData = await getAllTaiwanWeatherForecast(locationId)
  location.value = res.data.records.locations[0].locationsName
  allTaiwanWeather.value = res.data.records.locations[0].location
  loading.value = false
}
// 刷新後渲染當前天氣資料
onMounted(() => {
  reqAllTaiwanWeatherForecast(allTaiwanStore.locationId)
})
</script>

<style scoped lang="scss">
.northMid {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  color: red;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;

  .north {
    margin-right: 5px;
    float: left;
    background: rgba(239, 31, 66, 0.194);
    padding: 5px;
    border-radius: 20px;
  }

  .mid {
    margin-left: 5px;
    float: right;
    background: rgba(239, 31, 66, 0.194);
    padding: 5px;
    border-radius: 20px;
  }

}

.southEastOut {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: red;
  font-size: 20px;
  font-weight: bold;

  .south {
    margin-right: 5px;
    background: rgba(239, 31, 66, 0.194);
    padding: 5px;
    border-radius: 20px;
  }

  .east {
    margin: 0px 5px;
    background: rgba(239, 31, 66, 0.194);
    padding: 5px;
    border-radius: 20px;
  }

  .out {
    margin-left: 5px;
    background: rgba(239, 31, 66, 0.194);
    padding: 5px;
    border-radius: 20px;
  }

  .search {
    margin-left: 5px;
    background: rgba(239, 31, 66, 0.194);
    padding: 5px 10px;
    border-radius: 20px;

    .districtSearch {
      margin-top: 3px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
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

.tag {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  height: 120px;

  .title {
    font-size: 30px
  }

  div {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.text-center {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 250px;

  div {
    width: 125px;
    height: 30px;
    line-height: 30px;
  }
}



// RWD
// 1440px以下
@media screen and (max-width: 1440px) {
  .tag {
    .folder {
      font-size: 14.5px;
    }
  }
}

// 1280px以下
@media screen and (max-width: 1280px) {
  .tag {
    .folder {
      font-size: 13.5px;
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
    height: 140px;

    .folder {
      display: none;
    }
  }
}

// 680px以下
@media screen and (max-width: 680px) {
  .tag {
    height: 140px;

    .title {
      font-size: 24px;
    }

    .rwdDiv {
      font-size: 15px;
    }
  }
}

// 480px以上
@media screen and (min-width: 481px) {
  .toolBtnRwd {
    display: none;
  }
}

// 480px以下
@media screen and (max-width: 480px) {
  .northMid {
    flex-direction: column;

    div {
      margin: 5px;
    }
  }

  .southEastOut {
    flex-direction: column;

    div {
      margin: 10px;
    }
  }


  .tag {
    height: 140px;

    .title {
      font-size: 19px;
    }

    .rwdDiv {
      font-size: 12px;
    }
  }

  .toolBtn {
    display: none;

  }
}

// 414px以下
@media screen and (max-width: 414px) {

  .tag {
    height: 140px;

    .title {
      font-size: 17px;
    }

    .rwdDiv {
      font-size: 10px;
    }
  }

  .toolBtn {
    display: none;
  }
}

// 375px以下
@media screen and (max-width: 375px) {
  .tag {
    height: 140px;

    .title {
      font-size: 13px;
    }

    div {
      font-size: 12px;
    }

    .rwdDiv {
      font-size: 8px;
    }
  }

  .toolBtn {
    display: none;

  }
}
</style>