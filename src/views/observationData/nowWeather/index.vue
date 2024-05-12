<template>
  <div>
    <el-card style=" margin: 40px 50px; border-radius: 20px; ">
      <el-tag class="tag">
        <div class="title" style="color:salmon;  font-weight: bold;">當前天氣觀測資料</div>
        <div style="color:red; margin: 5px 0px;">此資料約每十分鐘更新一次</div>
        <div class="contentDiv">資料內容包含(相對溼度、降雨量、風速、氣壓、氣溫、紫外線指數)</div>
        <div class="contentDivRwd">資料內容包含(相對溼度、降雨量</div>
        <div class="contentDivRwd">、風速、氣壓、氣溫、紫外線指數)</div>
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
                    <el-input v-model="cityKeyword" placeholder="請輸入縣市名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                  <div class="districtSearch" style="margin: 0px 20px;">
                    <span style="margin-right: 5px; color:red;  font-weight: bold;">搜尋鄉鎮市區:</span>
                    <el-input v-model="districtKeyword" placeholder="請輸入鄉鎮市區" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                  <div class="stationSearch">
                    <span style="margin-right: 5px; color:red; font-size: 25px; font-weight: bold;">搜尋測量站:</span>
                    <el-input v-model="stationKeyword" placeholder="請輸入測量站名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                </div>
                <!-- 篩選功能 -->
                <div class="filter">
                  <span style="color:red; font-size: 25px; font-weight: bold;">依照縣市所在區域篩選:</span>
                  <span>北部:</span>
                  <el-switch v-model="nowWeatherStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="nowWeatherStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="nowWeatherStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="nowWeatherStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="nowWeatherStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="nowWeatherStore.resetFilter">重置篩選</el-button>
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
                  <div class="centerSearch">
                    <span style="margin-right: 5px; color:red; font-size: 25px; font-weight: bold;">搜尋縣市:</span>
                    <el-input v-model="cityKeyword" placeholder="請輸入縣市名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                  <div class="districtSearch" style="margin: 0px 20px;">
                    <span class="districtSearchSpan"
                      style="margin-right: 5px; color:red; font-weight: bold;">搜尋鄉鎮市區:</span>
                    <el-input v-model="districtKeyword" placeholder="請輸入鄉鎮市區" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                  <div class="stationSearch">
                    <span class="stationSearchSpan"
                      style="margin-right: 5px; color:red; font-weight: bold;">搜尋測量站:</span>
                    <el-input v-model="stationKeyword" placeholder="請輸入測量站名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color:red;" />
                    </el-icon>
                  </div>
                </div>
                <!-- 篩選功能 -->
                <div class="filter">
                  <span style="color:red; font-size: 25px; font-weight: bold;">依照縣市所在區域篩選:</span>
                  <span>北部:</span>
                  <el-switch v-model="nowWeatherStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="nowWeatherStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="nowWeatherStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="nowWeatherStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="nowWeatherStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="nowWeatherStore.resetFilter">重置篩選</el-button>
                </div>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tag>
      <!-- 天氣資料表格 -->
      <el-table :data="sliceNowWeather" max-height="calc(100vh - 415px)" border
        style="width: 1320px; margin: 20px auto;" v-loading="loading">
        <!-- 縣市名稱 -->
        <el-table-column align="center" min-width="85" fixed="left">
          <template #header>
            <div class="tableHeader">
              <span>縣市名稱</span>
              <div class="sortBtn">
                <el-button @click="sortByCountyNameUp" icon="CaretTop"></el-button>
                <el-button @click="sortByCountyNameDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-icon>
              <Location />
            </el-icon>
            <span>{{ row.GeoInfo.CountyName }}</span>
          </template>
        </el-table-column>
        <!-- 鄉鎮市區 -->
        <el-table-column align="center" min-width="85" fixed="left">
          <template #header>
            <div class="tableHeader">
              <span>鄉鎮市區</span>
              <div class="sortBtn">
                <el-button @click="sortByTownNameUp" icon="CaretTop"></el-button>
                <el-button @click="sortByTownNameDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <span>{{ row.GeoInfo.TownName }}</span>
          </template>
        </el-table-column>
        <!-- 測量站名稱 -->
        <el-table-column prop="StationName" align="center" min-width="100" fixed="left">
          <template #header>
            <div class="tableHeader">
              <span>測量站名稱</span>
              <div class="sortBtn">
                <el-button @click="sortByStationNameUp" icon="CaretTop"></el-button>
                <el-button @click="sortByStationNameDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 更新時間 -->
        <el-table-column label="更新時間" width="150" align="center">
          <template #default="{ row }">
            <span>{{ `${row.ObsTime.DateTime.slice(0, 10)} ${row.ObsTime.DateTime.slice(11, 19)}` }}</span>
          </template>
        </el-table-column>
        <!-- 相對溼度 -->
        <el-table-column width="150" align="center">
          <template #header>
            <div class="tableHeader">
              <span>相對溼度</span>
              <div class="sortBtn">
                <el-button @click="sortByRelativeHumidityUp" icon="CaretTop"></el-button>
                <el-button @click="sortByRelativeHumidityDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.WeatherElement.RelativeHumidity === -99 || row.WeatherElement.RelativeHumidity === 'X'">X：表示儀器故障
                  -99：表示缺值或資料異常</span>
                <span v-else>實際水氣量佔該溫度飽和水氣量之百分比。</span>
              </template>
              <template #reference>
                <span v-if="row.WeatherElement.RelativeHumidity === -99 || row.WeatherElement.RelativeHumidity === 'X'"
                  style="color:red;">{{ `${row.WeatherElement.RelativeHumidity}%` }}</span>
                <span v-else>{{ `${row.WeatherElement.RelativeHumidity}%` }}
                  <img src="@/assets/observationData/nowWeather/humidity.png" alt="濕度"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 降雨量 -->
        <el-table-column width="120" align="center">
          <template #header>
            <div class="tableHeader">
              <span>降雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.WeatherElement.Now.Precipitation === -99 || row.WeatherElement.Now.Precipitation === 'X' || row.WeatherElement.Now.Precipitation === 'T' || row.WeatherElement.Now.Precipitation === -98 || row.WeatherElement.Now.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.WeatherElement.Now.Precipitation === -99 || row.WeatherElement.Now.Precipitation === 'X' || row.WeatherElement.Now.Precipitation === 'T' || row.WeatherElement.Now.Precipitation === -98"
                  style="color:red;">{{ `${row.WeatherElement.Now.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.WeatherElement.Now.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.WeatherElement.Now.Precipitation} mm` }}
                  <img src="@/assets/observationData/nowWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 風速 -->
        <el-table-column width="120" align="center">
          <template #header>
            <div class="tableHeader">
              <span>風速</span>
              <div class="sortBtn">
                <el-button @click="sortByWindSpeedUp" icon="CaretTop"></el-button>
                <el-button @click="sortByWindSpeedDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span v-if="row.WeatherElement.WindSpeed === -99 || row.WeatherElement.WindSpeed === 'X'">X：表示儀器故障
                  -99：表示缺值或資料異常</span>
                <span v-else>觀測風的速度之平均值。</span>
              </template>
              <template #reference>
                <span v-if="row.WeatherElement.WindSpeed === -99 || row.WeatherElement.WindSpeed === 'X'"
                  style="color:red;">{{ `${row.WeatherElement.WindSpeed} m/s` }}</span>
                <span v-else>{{ `${row.WeatherElement.WindSpeed} m/s` }}
                  <img src="@/assets/observationData/nowWeather/windsock.png" alt="風速"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 氣壓 -->
        <el-table-column width="120" align="center">
          <template #header>
            <div class="tableHeader">
              <span>氣壓</span>
              <div class="sortBtn">
                <el-button @click="sortByAirPressureUp" icon="CaretTop"></el-button>
                <el-button @click="sortByAirPressureDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span v-if="row.WeatherElement.AirPressure === -99 || row.WeatherElement.AirPressure === 'X'">X：表示儀器故障
                  -99：表示缺值或資料異常</span>
                <span v-else>氣壓為大氣壓力的簡稱，為在水平面上單位面積承受之大氣重量。</span>
              </template>
              <template #reference>
                <span v-if="row.WeatherElement.AirPressure === -99 || row.WeatherElement.AirPressure === 'X'"
                  style="color:red;">{{
                    `${row.WeatherElement.AirPressure} hPa` }}</span>
                <span v-else>{{ `${row.WeatherElement.AirPressure} hPa` }}</span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 氣溫 -->
        <el-table-column width="120" align="center">
          <template #header>
            <div class="tableHeader">
              <span>氣溫</span>
              <div class="sortBtn">
                <el-button @click="sortByAirTemperatureUp" icon="CaretTop"></el-button>
                <el-button @click="sortByAirTemperatureDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.WeatherElement.AirTemperature === -99 || row.WeatherElement.AirTemperature === 'X'">X：表示儀器故障
                  -99：表示缺值或資料異常</span>
                <span v-else>空氣的溫度。</span>
              </template>
              <template #reference>
                <span v-if="row.WeatherElement.AirTemperature === -99 || row.WeatherElement.AirTemperature === 'X'"
                  style="color:red;">{{ `${row.WeatherElement.AirTemperature} °C` }}</span>
                <span v-else>{{ `${row.WeatherElement.AirTemperature} °C` }}
                  <img src="@/assets/observationData/nowWeather/temp.png" alt="溫度"
                    style="width: 20px; height: 20px; background: chocolate; border-radius: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 紫外線指數 -->
        <el-table-column width="140" align="center">
          <template #header>
            <div class="tableHeader">
              <span>紫外線指數</span>
              <div class="sortBtn">
                <el-button @click="sortByUVIndexUp" icon="CaretTop"></el-button>
                <el-button @click="sortByUVIndexDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span v-if="row.WeatherElement.UVIndex === -99 || row.WeatherElement.UVIndex === 'X'">X：表示儀器故障
                  -99：表示缺值或資料異常</span>
                <span v-else>紫外線指數分級說明： 0-2 低量級 3-5 中量級 6-7 高量級 8-10 過量級 11+ 危險級</span>
              </template>
              <template #reference>
                <span v-if="row.WeatherElement.UVIndex === -99 || row.WeatherElement.UVIndex === 'X'"
                  style="color:pink;">{{ `${row.WeatherElement.UVIndex} UVI` }}</span>
                <span v-if="row.WeatherElement.UVIndex >= 0 && row.WeatherElement.UVIndex <= 2"
                  style="color:#1afa29;">{{
                    ` ${row.WeatherElement.UVIndex} UVI ` }}
                  <img src="@/assets/observationData/nowWeather/greenSunny.png" alt="低量級"
                    style="width: 20px; height: 20px; " />
                </span>
                <span v-if="row.WeatherElement.UVIndex >= 3 && row.WeatherElement.UVIndex <= 5"
                  style="color:#e0620d;">{{
                    `${row.WeatherElement.UVIndex} UVI ` }}
                  <img src="@/assets/observationData/nowWeather/orangeSunny.png" alt="中量級"
                    style="width: 20px; height: 20px; " />
                </span>
                <span v-if="row.WeatherElement.UVIndex >= 6 && row.WeatherElement.UVIndex <= 7"
                  style="color:#f39800;">{{
                    `${row.WeatherElement.UVIndex} UVI ` }}
                  <img src="@/assets/observationData/nowWeather/orangeSunny-2.png" alt="高量級"
                    style="width: 20px; height: 20px; " />
                </span>
                <span v-if="row.WeatherElement.UVIndex >= 8 && row.WeatherElement.UVIndex <= 10"
                  style="color:#d81e06;">{{
                    `${row.WeatherElement.UVIndex} UVI ` }}
                  <img src="@/assets/observationData/nowWeather/redSunny.png" alt="過量級"
                    style="width: 20px; height: 20px; " />
                </span>
                <span v-if="row.WeatherElement.UVIndex >= 11" style="color:#594d9c;">{{
                  `${row.WeatherElement.UVIndex} UVI ` }}
                  <img src="@/assets/observationData/nowWeather/purpleSunny.png" alt="危險級"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分頁組件 -->
      <el-pagination style="margin-top: 20px;" v-model:current-page="currentPage" v-model:page-size="pageSize"
        :page-sizes="[5, 15, 25, 35]" :background="true" layout=" prev, pager, next, jumper, ->, sizes, total"
        :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
// 引入接口以及接口type
import { getNowWeatherForecast } from '@/apis/observationData/index'
import type { nowWeatherData, Station } from '@/apis/observationData/type/nowWeather'
// 引入倉庫
import { useNowWeatherStore } from '@/stores/observationData/nowWeather'
const nowWeatherStore = useNowWeatherStore()
// 接收當前天氣的資料
const nowWeather = ref<Station[]>([])
// 引入東南西北地區
const north: string[] = ['臺北市', '新北市', '基隆市', '新竹市', '桃園市', '新竹縣', '宜蘭縣']
const mid: string[] = ['臺中市', '苗栗縣', '彰化縣', '南投縣', '雲林縣']
const south: string[] = ['高雄市', '臺南市', '嘉義市', '嘉義縣', '屏東縣']
const east: string[] = ['花蓮縣', '臺東縣']
const out: string[] = ['金門縣', '連江縣', '澎湖縣']
// 篩選區域
const filter = computed(() => {
  const filterByArea = (area: string[]) => nowWeather.value.filter(item => area.includes(item.GeoInfo.CountyName));

  let filteredWeather: Station[] = []

  if (nowWeatherStore.east) {
    filteredWeather = filteredWeather.concat(filterByArea(east));
  }
  if (nowWeatherStore.south) {
    filteredWeather = filteredWeather.concat(filterByArea(south));
  }
  if (nowWeatherStore.mid) {
    filteredWeather = filteredWeather.concat(filterByArea(mid));
  }
  if (nowWeatherStore.north) {
    filteredWeather = filteredWeather.concat(filterByArea(north));
  }
  if (nowWeatherStore.out) {
    filteredWeather = filteredWeather.concat(filterByArea(out));
  }
  if (!nowWeatherStore.east && !nowWeatherStore.south && !nowWeatherStore.mid && !nowWeatherStore.north && !nowWeatherStore.out) {
    reqNowWeatherForecast();
  }
  return filteredWeather
});
// 監聽使用者選擇的地區
watch(() =>
  [nowWeatherStore.east, nowWeatherStore.south, nowWeatherStore.mid, nowWeatherStore.north, nowWeatherStore.out]
  , () => {
    nowWeather.value = filter.value
    reqNowWeatherForecast()
  })
// 分頁組件
const currentPage = ref<number>(1)
const pageSize = ref<number>(15)
const total = ref<number>(0)
// 載入動畫
const loading = ref<boolean>(true)
// 控制pageSize
const handleSizeChange = (size: number) => {
  pageSize.value = size
  reqNowWeatherForecast()
}
// 控制currentPage
const handleCurrentChange = (page: number) => {
  nowWeatherStore.pages = page
  currentPage.value = page
}
// 計算分頁後要渲染的資料
const sliceNowWeather = computed(() => {
  return searchNowWeather.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})
// 搜尋功能
const cityKeyword = ref<string>('')
const districtKeyword = ref<string>('')
const stationKeyword = ref<string>('')
// 計算搜尋關鍵字的資料
const searchNowWeather = computed(() => {
  return nowWeather.value.filter((item) => {
    if (cityKeyword.value !== '') {
      return item.GeoInfo.CountyName.match(cityKeyword.value)
    }
    else if (districtKeyword.value !== '') {
      return item.GeoInfo.TownName.match(districtKeyword.value)
    }
    else if (stationKeyword.value !== '') {
      return item.StationName.match(stationKeyword.value)
    } else {
      return item
    }
  })
})
// 監聽搜尋關鍵字的資料並修改資料總數
watch(searchNowWeather, () => {
  if (cityKeyword.value === '' && districtKeyword.value === '' && stationKeyword.value === '') {
    total.value = nowWeather.value.length
  } else {
    total.value = searchNowWeather.value.length
  }
})
// 監聽搜尋關鍵字，當關鍵字清空回到第一頁
watch(() => [cityKeyword.value, districtKeyword.value, stationKeyword.value]
  , () => {
    if (cityKeyword.value === '' && districtKeyword.value === '' && stationKeyword.value === '') {
      currentPage.value = 1
    }
  })
// 監聽如果搜尋縣市不等於空，清空其他兩項搜尋欄關鍵字
watch(() => cityKeyword.value, () => {
  if (cityKeyword.value !== '') {
    districtKeyword.value = ''
    stationKeyword.value = ''
  }
})
// 監聽如果搜尋鄉鎮市區不等於空，清空其他兩項搜尋欄關鍵字
watch(() => districtKeyword.value, () => {
  if (districtKeyword.value !== '') {
    cityKeyword.value = ''
    stationKeyword.value = ''
  }
})
// 監聽如果搜尋測量站不等於空，清空其他兩項搜尋欄關鍵字
watch(() => stationKeyword.value, () => {
  if (stationKeyword.value !== '') {
    districtKeyword.value = ''
    cityKeyword.value = ''
  }
})
// 資料排序
// 按照縣市名稱排序
const sortByCountyNameUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.GeoInfo.CountyName.localeCompare(a.GeoInfo.CountyName)
  })
}
const sortByCountyNameDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.GeoInfo.CountyName.localeCompare(b.GeoInfo.CountyName)
  })
}
// 按照鄉鎮名稱排序
const sortByTownNameUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.GeoInfo.TownName.localeCompare(a.GeoInfo.TownName)
  })
}
const sortByTownNameDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.GeoInfo.TownName.localeCompare(b.GeoInfo.TownName)
  })
}
// 按照測量站名稱排序
const sortByStationNameUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.StationName.localeCompare(a.StationName)
  })
}
const sortByStationNameDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.StationName.localeCompare(b.StationName)
  })
}
// 按照相對溼度排序
const sortByRelativeHumidityUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.RelativeHumidity - a.WeatherElement.RelativeHumidity
  })
}
const sortByRelativeHumidityDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.RelativeHumidity - b.WeatherElement.RelativeHumidity
  })
}
// 按照降雨量排序
const sortByPrecipitationUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.Now.Precipitation - a.WeatherElement.Now.Precipitation
  })
}
const sortByPrecipitationDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.Now.Precipitation - b.WeatherElement.Now.Precipitation
  })
}
// 按照風速大小排序
const sortByWindSpeedUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.WindSpeed - a.WeatherElement.WindSpeed
  })
}
const sortByWindSpeedDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.WindSpeed - b.WeatherElement.WindSpeed
  })
}
// 按照氣壓大小排序
const sortByAirPressureUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.AirPressure - a.WeatherElement.AirPressure
  })
}
const sortByAirPressureDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.AirPressure - b.WeatherElement.AirPressure
  })
}
// 按照氣溫大小排序
const sortByAirTemperatureUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.AirTemperature - a.WeatherElement.AirTemperature
  })
}
const sortByAirTemperatureDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.AirTemperature - b.WeatherElement.AirTemperature
  })
}
// 按照紫外線大小排序
const sortByUVIndexUp = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.UVIndex - a.WeatherElement.UVIndex
  })
}
const sortByUVIndexDown = () => {
  nowWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.UVIndex - b.WeatherElement.UVIndex
  })
}
// 獲取當前天氣資料
const reqNowWeatherForecast = async () => {
  const res: nowWeatherData = await getNowWeatherForecast()
  nowWeather.value = res.data.records.Station
  total.value = nowWeather.value.length
  if (nowWeatherStore.east || nowWeatherStore.south || nowWeatherStore.mid || nowWeatherStore.north || nowWeatherStore.out) {
    nowWeather.value = filter.value
  }
  loading.value = false
}
// 刷新後渲染當前天氣資料
onMounted(() => {
  currentPage.value = nowWeatherStore.pages
  reqNowWeatherForecast()
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


.tableHeader {
  display: flex;
  justify-content: center;
  align-items: center;

  .sortBtn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-left: 10px;
    cursor: pointer;

    button {
      width: 15px;
      height: 15px;
      margin: 0px;
    }
  }
}

.search {
  display: flex;
  justify-content: center;
  align-items: center;

  .districtSearch {
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      font-size: 25px;
    }
  }
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

// RWD
// 1280px以下
@media screen and (max-width: 1280px) {
  .search {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .districtSearch {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .centerSearch {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 10px;
    }

    .stationSearch {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 10px;
    }
  }

  .filter {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 30px;
    flex-direction: column;

    span {
      margin: 0px 10px;
      color: red;
      font-size: 18px;
      font-weight: bold;
    }
  }
}

// 870px以下
@media screen and (max-width: 870px) {
  .tag {
    .contentDiv {
      font-size: 14px;
    }
  }
}

// 680px以上
@media screen and (min-width: 681px) {
  .tag {
    .contentDivRwd {
      display: none;
    }
  }
}

// 680px以下
@media screen and (max-width: 680px) {
  .tag {
    height: 140px;

    .contentDiv {
      display: none;
    }
  }

}

// 414px以上
@media screen and (min-width: 415px) {
  .tag {
    .checkBtnRwd {
      display: none;
    }
  }
}

// 414px以下
@media screen and (max-width: 414px) {
  .tag {
    .title {
      font-size: 26px;
    }

    .checkBtn {
      display: none;
    }

    .contentDivRwd {
      font-size: 14px;
    }
  }

  .search {
    .districtSearch {
      .districtSearchSpan {
        font-size: 16px;
      }
    }

    .stationSearchSpan {
      font-size: 18px;
    }
  }
}

// 320px以下
@media screen and (max-width: 320px) {
  .tag {
    .title {
      font-size: 22px;
    }

    font-size: 14px;

    .checkBtn {
      display: none;
    }

    .contentDivRwd {
      font-size: 11.5px;
    }
  }
}
</style>