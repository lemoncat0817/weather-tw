<template>
  <div>
    <el-card style=" margin: 40px 50px; border-radius: 20px; ">
      <el-tag class="tag">
        <div class="title" style="color:salmon;  font-weight: bold;">自動氣象站-氣象觀測資料</div>
        <div style="color:red; margin: 5px 0px;">此資料約每一小時更新一次</div>
        <div class="contentDiv">資料內容包含(相對溼度、降雨量、風速、氣壓、氣溫)</div>
        <el-dropdown style="margin-top: 10px; ">
          <el-button class="chcekBtn" type="warning">
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
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                  <div class="districtSearch" style="margin: 0px 20px;">
                    <span style="margin-right: 5px; color:red; font-size: 25px; font-weight: bold;">搜尋鄉鎮市區:</span>
                    <el-input v-model="districtKeyword" placeholder="請輸入鄉鎮市區" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                  <div class="stationSearch">
                    <span style="margin-right: 5px; color:red; font-size: 25px; font-weight: bold;">搜尋測量站:</span>
                    <el-input v-model="stationKeyword" placeholder="請輸入測量站名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                </div>
                <!-- 篩選功能 -->
                <div class="filter">
                  <span style="color:red; font-size: 25px; font-weight: bold;">依照縣市所在區域篩選:</span>
                  <span>北部:</span>
                  <el-switch v-model="autoStationWeatherStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="autoStationWeatherStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="autoStationWeatherStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="autoStationWeatherStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="autoStationWeatherStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="autoStationWeatherStore.resetFilter">重置篩選</el-button>
                </div>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown style="margin-top: 10px; ">
          <el-button class="chcekBtnRwd" type="warning">
            <span style="color: yellow;">搜尋/查看/篩選區域</span>
            <el-icon style="margin-left: 10px;"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu style="padding: 0; ">
              <el-card style="background: pink; ">
                <!-- 搜尋功能 -->
                <div class="search">
                  <div class="centerSearch">
                    <span style="margin-right: 5px; color:red;  font-weight: bold;">搜尋縣市:</span>
                    <el-input v-model="cityKeyword" placeholder="請輸入縣市名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                  <div class="districtSearch" style="margin: 0px 20px;">
                    <span style="margin-right: 5px; color:red;  font-weight: bold;">搜尋鄉鎮市區:</span>
                    <el-input v-model="districtKeyword" placeholder="請輸入鄉鎮市區" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                  <div class="stationSearch">
                    <span style="margin-right: 5px; color:red;  font-weight: bold;">搜尋測量站:</span>
                    <el-input v-model="stationKeyword" placeholder="請輸入測量站名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                </div>
                <!-- 篩選功能 -->
                <div class="filter">
                  <span style="color:red; font-size: 25px; font-weight: bold;">依照縣市所在區域篩選:</span>
                  <span>北部:</span>
                  <el-switch v-model="autoStationWeatherStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="autoStationWeatherStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="autoStationWeatherStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="autoStationWeatherStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="autoStationWeatherStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="autoStationWeatherStore.resetFilter">重置篩選</el-button>
                </div>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tag>
      <!-- 天氣資料表格 -->
      <el-table :data="sliceAutoStationWeather" border max-height="calc(100vh - 415px)"
        style="width: 90%; margin: 20px auto;" v-loading="loading">
        <!-- 縣市名稱 -->
        <el-table-column align="center" fixed="left" min-width="85">
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
        <el-table-column align="center" fixed="left" min-width="85">
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
        <el-table-column prop="StationName" align="center" fixed="left" min-width="100">
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
                  <img src="@/assets/observationData/autoStationWeather/humidity.png" alt="濕度"
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
                  <img src="@/assets/observationData/autoStationWeather/rain.png" alt="降雨量"
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
                  <img src="@/assets/observationData/autoStationWeather/windsock.png" alt="風速"
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
                  <img src="@/assets/observationData/autoStationWeather/temp.png" alt="溫度"
                    style="width: 20px; height: 20px; background: chocolate; border-radius: 20px; " />
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
import { onMounted, ref, computed, watch } from "vue"
// 引入接口以及接口type
import { getAutoStationWeatherForecast } from "@/apis/observationData/index"
import type { autoStationWeatherData, Station } from '@/apis/observationData/type/autoStation'
// 引入倉庫
import { useAutoStationWeatherStore } from '@/stores/observationData/autoStationWeather'
const autoStationWeatherStore = useAutoStationWeatherStore()
// 接收當前天氣的資料
const autoStationWeather = ref<Station[]>([])
// 引入東南西北地區
const north: string[] = ['臺北市', '新北市', '基隆市', '新竹市', '桃園市', '新竹縣', '宜蘭縣']
const mid: string[] = ['臺中市', '苗栗縣', '彰化縣', '南投縣', '雲林縣']
const south: string[] = ['高雄市', '臺南市', '嘉義市', '嘉義縣', '屏東縣']
const east: string[] = ['花蓮縣', '臺東縣']
const out: string[] = ['金門縣', '連江縣', '澎湖縣']
// 篩選區域
const filter = computed(() => {
  const filterByArea = (area: string[]) => autoStationWeather.value.filter(item => area.includes(item.GeoInfo.CountyName));

  let filteredWeather: Station[] = []

  if (autoStationWeatherStore.east) {
    filteredWeather = filteredWeather.concat(filterByArea(east));
  }
  if (autoStationWeatherStore.south) {
    filteredWeather = filteredWeather.concat(filterByArea(south));
  }
  if (autoStationWeatherStore.mid) {
    filteredWeather = filteredWeather.concat(filterByArea(mid));
  }
  if (autoStationWeatherStore.north) {
    filteredWeather = filteredWeather.concat(filterByArea(north));
  }
  if (autoStationWeatherStore.out) {
    filteredWeather = filteredWeather.concat(filterByArea(out));
  }
  if (!autoStationWeatherStore.east && !autoStationWeatherStore.south && !autoStationWeatherStore.mid && !autoStationWeatherStore.north && !autoStationWeatherStore.out) {
    reqAutoStationWeatherForecast();
  }
  return filteredWeather
});
// 監聽使用者選擇的地區
watch(() =>
  [autoStationWeatherStore.east, autoStationWeatherStore.south, autoStationWeatherStore.mid, autoStationWeatherStore.north, autoStationWeatherStore.out]
  , () => {
    autoStationWeather.value = filter.value
    reqAutoStationWeatherForecast()
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
  reqAutoStationWeatherForecast()
}
// 控制currentPage
const handleCurrentChange = (page: number) => {
  autoStationWeatherStore.pages = page
  currentPage.value = page
}
// 計算分頁後要渲染的資料
const sliceAutoStationWeather = computed(() => {
  return searchAutoStationWeather.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})
// 搜尋功能
const cityKeyword = ref<string>('')
const districtKeyword = ref<string>('')
const stationKeyword = ref<string>('')
// 計算搜尋關鍵字的資料
const searchAutoStationWeather = computed(() => {
  return autoStationWeather.value.filter((item) => {
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
watch(searchAutoStationWeather, () => {
  if (cityKeyword.value === '' && districtKeyword.value === '' && stationKeyword.value === '') {
    total.value = autoStationWeather.value.length
  } else {
    total.value = searchAutoStationWeather.value.length
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
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.GeoInfo.CountyName.localeCompare(a.GeoInfo.CountyName)
  })
}
const sortByCountyNameDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.GeoInfo.CountyName.localeCompare(b.GeoInfo.CountyName)
  })
}
// 按照鄉鎮名稱排序
const sortByTownNameUp = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.GeoInfo.TownName.localeCompare(a.GeoInfo.TownName)
  })
}
const sortByTownNameDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.GeoInfo.TownName.localeCompare(b.GeoInfo.TownName)
  })
}
// 按照測量站名稱排序
const sortByStationNameUp = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.StationName.localeCompare(a.StationName)
  })
}
const sortByStationNameDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.StationName.localeCompare(b.StationName)
  })
}
// 按照相對溼度排序
const sortByRelativeHumidityUp = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.RelativeHumidity - a.WeatherElement.RelativeHumidity
  })
}
const sortByRelativeHumidityDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.RelativeHumidity - b.WeatherElement.RelativeHumidity
  })
}
// 按照降雨量排序
const sortByPrecipitationUp = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.Now.Precipitation - a.WeatherElement.Now.Precipitation
  })
}
const sortByPrecipitationDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.Now.Precipitation - b.WeatherElement.Now.Precipitation
  })
}
// 按照風速大小排序
const sortByWindSpeedUp = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.WindSpeed - a.WeatherElement.WindSpeed
  })
}
const sortByWindSpeedDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.WindSpeed - b.WeatherElement.WindSpeed
  })
}
// 按照氣壓大小排序
const sortByAirPressureUp = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.AirPressure - a.WeatherElement.AirPressure
  })
}
const sortByAirPressureDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.AirPressure - b.WeatherElement.AirPressure
  })
}
// 按照氣溫大小排序
const sortByAirTemperatureUp = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return b.WeatherElement.AirTemperature - a.WeatherElement.AirTemperature
  })
}
const sortByAirTemperatureDown = () => {
  autoStationWeather.value.sort((a: any, b: any) => {
    return a.WeatherElement.AirTemperature - b.WeatherElement.AirTemperature
  })
}
// 獲取當前天氣資料
const reqAutoStationWeatherForecast = async () => {
  const res: autoStationWeatherData = await getAutoStationWeatherForecast()
  autoStationWeather.value = res.data.records.Station
  if (autoStationWeatherStore.east || autoStationWeatherStore.south || autoStationWeatherStore.mid || autoStationWeatherStore.north || autoStationWeatherStore.out) {
    autoStationWeather.value = filter.value
  }
  loading.value = false
}
// 刷新後渲染當前天氣資料
onMounted(() => {
  reqAutoStationWeatherForecast()
})
</script>

<style scoped lang="scss">
.search {
  display: flex;
  justify-content: center;
  align-items: center;

  .districtSearch {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 25px;
  }

  .centerSearch {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 25px;
  }

  .stationSearch {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 25px;
  }
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

// 680px以下
@media screen and (max-width: 680px) {
  .tag {
    height: 140px;

    .contentDiv {
      font-size: 14px;
    }
  }

}

// 414px以下
@media screen and (max-width: 414px) {
  .tag {
    height: 140px;

    .title {
      font-size: 20px;
    }

    .contentDiv {
      font-size: 10px;
    }
  }
}

// 375px以下
@media screen and (min-width: 376px) {
  .chcekBtnRwd {
    display: none;
  }
}

// 375px以下
@media screen and (max-width: 375px) {
  .tag {
    height: 140px;
    font-size: 14px;

    .title {
      font-size: 16px;
    }

    .chcekBtn {
      display: none;
    }

    .contentDiv {
      font-size: 7.5px;
    }
  }
}
</style>