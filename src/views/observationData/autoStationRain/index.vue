<template>
  <div>
    <el-card style=" margin: 40px 50px; border-radius: 20px; ">
      <el-tag class="tag">
        <div class="title" style="color:salmon;  font-weight: bold;">自動雨量站-雨量觀測資料</div>
        <div style="color:red; margin: 5px 0px;">此資料約每十分鐘更新一次</div>
        <div class="content">資料內容包含(當前累計雨量，過去十分鐘累計雨量，過去一、三、六、十二小時累計雨量，過去一、二、三天累計雨量)</div>
        <div class="contentRwd">資料內容包含(當前累計雨量，過去十分鐘累計雨量</div>
        <div class="contentRwd">過去一、三、六、十二小時累計雨量，過去一、二、三天累計雨量)</div>
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
                    <span style="margin-right: 5px; color:red; font-weight: bold;">搜尋測量站:</span>
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
                  <el-switch v-model="autoStationRainWeatherStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="autoStationRainWeatherStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="autoStationRainWeatherStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="autoStationRainWeatherStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="autoStationRainWeatherStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="autoStationRainWeatherStore.resetFilter">重置篩選</el-button>
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
                    <span style="margin-right: 5px; color:red; font-weight: bold;">搜尋縣市:</span>
                    <el-input v-model="cityKeyword" placeholder="請輸入縣市名稱" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                  <div class="districtSearch" style="margin: 0px 20px;">
                    <span style="margin-right: 5px; color:red; font-weight: bold;">搜尋鄉鎮市區:</span>
                    <el-input v-model="districtKeyword" placeholder="請輸入鄉鎮市區" style="width: 150px;" />
                    <el-icon style="border: 2px gray solid; padding: 5px; ">
                      <Search style="color: red;" />
                    </el-icon>
                  </div>
                  <div class="stationSearch">
                    <span style="margin-right: 5px; color:red; font-weight: bold;">搜尋測量站:</span>
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
                  <el-switch v-model="autoStationRainWeatherStore.north" />
                  <span>中部:</span>
                  <el-switch v-model="autoStationRainWeatherStore.mid" />
                  <span>南部:</span>
                  <el-switch v-model="autoStationRainWeatherStore.south" />
                  <span>東部:</span>
                  <el-switch v-model="autoStationRainWeatherStore.east" />
                  <span>離島:</span>
                  <el-switch v-model="autoStationRainWeatherStore.out" />
                  <el-button style="margin-left: 10px;" type="primary"
                    @click="autoStationRainWeatherStore.resetFilter">重置篩選</el-button>
                </div>
              </el-card>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tag>
      <!-- 天氣資料表格 -->
      <el-table :data="sliceAutoStationRainWeather" border max-height="calc(100vh - 415px)"
        style="width: 90%; margin: 20px auto;" v-loading="loading">
        <!-- 縣市名稱 -->
        <el-table-column align="center" min-width="125" fixed="left">
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
        <el-table-column align="center" min-width="125" fixed="left">
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
        <el-table-column prop="StationName" align="center" min-width="145" fixed="left">
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
        <!-- 當前累計雨量 -->
        <el-table-column width="160" align="center">
          <template #header>
            <div class="tableHeader">
              <span>當前累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByNowPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByNowPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Now.Precipitation === -99 || row.RainfallElement.Now.Precipitation === 'X' || row.RainfallElement.Now.Precipitation === 'T' || row.RainfallElement.Now.Precipitation === -98 || row.RainfallElement.Now.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Now.Precipitation === -99 || row.RainfallElement.Now.Precipitation === 'X' || row.RainfallElement.Now.Precipitation === 'T' || row.RainfallElement.Now.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Now.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Now.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Now.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去十分鐘累計雨量 -->
        <el-table-column width="200" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去十分鐘累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast10MinPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast10MinPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past10Min.Precipitation === -99 || row.RainfallElement.Past10Min.Precipitation === 'X' || row.RainfallElement.Past10Min.Precipitation === 'T' || row.RainfallElement.Past10Min.Precipitation === -98 || row.RainfallElement.Past10Min.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past10Min.Precipitation === -99 || row.RainfallElement.Past10Min.Precipitation === 'X' || row.RainfallElement.Past10Min.Precipitation === 'T' || row.RainfallElement.Past10Min.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past10Min.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past10Min.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past10Min.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去一小時累計雨量 -->
        <el-table-column width="200" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去一小時累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast1hrPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast1hrPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past1hr.Precipitation === -99 || row.RainfallElement.Past1hr.Precipitation === 'X' || row.RainfallElement.Past1hr.Precipitation === 'T' || row.RainfallElement.Past1hr.Precipitation === -98 || row.RainfallElement.Past1hr.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past1hr.Precipitation === -99 || row.RainfallElement.Past1hr.Precipitation === 'X' || row.RainfallElement.Past1hr.Precipitation === 'T' || row.RainfallElement.Past1hr.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past1hr.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past1hr.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past1hr.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去三小時累計雨量 -->
        <el-table-column width="200" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去三小時累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast3hrPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast3hrPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past3hr.Precipitation === -99 || row.RainfallElement.Past3hr.Precipitation === 'X' || row.RainfallElement.Past3hr.Precipitation === 'T' || row.RainfallElement.Past3hr.Precipitation === -98 || row.RainfallElement.Past3hr.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past3hr.Precipitation === -99 || row.RainfallElement.Past3hr.Precipitation === 'X' || row.RainfallElement.Past3hr.Precipitation === 'T' || row.RainfallElement.Past3hr.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past3hr.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past3hr.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past3hr.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去六小時累計雨量 -->
        <el-table-column width="200" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去六小時累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast6HrPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast6HrPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past6Hr.Precipitation === -99 || row.RainfallElement.Past6Hr.Precipitation === 'X' || row.RainfallElement.Past6Hr.Precipitation === 'T' || row.RainfallElement.Past6Hr.Precipitation === -98 || row.RainfallElement.Past6Hr.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past6Hr.Precipitation === -99 || row.RainfallElement.Past6Hr.Precipitation === 'X' || row.RainfallElement.Past6Hr.Precipitation === 'T' || row.RainfallElement.Past6Hr.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past6Hr.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past6Hr.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past6Hr.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去十二小時累計雨量 -->
        <el-table-column width="210" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去十二小時累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast12hrPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast12hrPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past12hr.Precipitation === -99 || row.RainfallElement.Past12hr.Precipitation === 'X' || row.RainfallElement.Past12hr.Precipitation === 'T' || row.RainfallElement.Past12hr.Precipitation === -98 || row.RainfallElement.Past12hr.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past12hr.Precipitation === -99 || row.RainfallElement.Past12hr.Precipitation === 'X' || row.RainfallElement.Past12hr.Precipitation === 'T' || row.RainfallElement.Past12hr.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past12hr.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past12hr.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past12hr.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去一天累計雨量 -->
        <el-table-column width="200" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去一天累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast24hrPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast24hrPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past24hr.Precipitation === -99 || row.RainfallElement.Past24hr.Precipitation === 'X' || row.RainfallElement.Past24hr.Precipitation === 'T' || row.RainfallElement.Past24hr.Precipitation === -98 || row.RainfallElement.Past24hr.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past24hr.Precipitation === -99 || row.RainfallElement.Past24hr.Precipitation === 'X' || row.RainfallElement.Past24hr.Precipitation === 'T' || row.RainfallElement.Past24hr.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past24hr.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past24hr.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past24hr.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去兩天累計雨量 -->
        <el-table-column width="200" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去兩天累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast2daysPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast2daysPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past2days.Precipitation === -99 || row.RainfallElement.Past2days.Precipitation === 'X' || row.RainfallElement.Past2days.Precipitation === 'T' || row.RainfallElement.Past2days.Precipitation === -98 || row.RainfallElement.Past2days.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past2days.Precipitation === -99 || row.RainfallElement.Past2days.Precipitation === 'X' || row.RainfallElement.Past2days.Precipitation === 'T' || row.RainfallElement.Past2days.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past2days.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past2days.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past2days.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
                    style="width: 20px; height: 20px; " />
                </span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <!-- 過去三天累計雨量 -->
        <el-table-column width="200" align="center">
          <template #header>
            <div class="tableHeader">
              <span>過去三天累計雨量</span>
              <div class="sortBtn">
                <el-button @click="sortByPast3daysPrecipitationUp" icon="CaretTop"></el-button>
                <el-button @click="sortByPast3daysPrecipitationDown" icon="CaretBottom"></el-button>
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <el-popover :width="200" trigger="hover">
              <template #default>
                <span
                  v-if="row.RainfallElement.Past3days.Precipitation === -99 || row.RainfallElement.Past3days.Precipitation === 'X' || row.RainfallElement.Past3days.Precipitation === 'T' || row.RainfallElement.Past3days.Precipitation === -98 || row.RainfallElement.Past3days.Precipitation === -990">X：表示儀器故障
                  T：表示雨跡 -99：表示缺值或資料異常 -98：表示連續 6 小時無降水</span>
                <span v-else>在一定時間內大氣中任何液體或固體形態的水物質降落到達地面，在無蒸發、流失或滲透等損耗情況下。</span>
              </template>
              <template #reference>
                <span
                  v-if="row.RainfallElement.Past3days.Precipitation === -99 || row.RainfallElement.Past3days.Precipitation === 'X' || row.RainfallElement.Past3days.Precipitation === 'T' || row.RainfallElement.Past3days.Precipitation === -98"
                  style="color:red;">{{ `${row.RainfallElement.Past3days.Precipitation} mm` }}</span>
                <span style="color:red;" v-if="row.RainfallElement.Past3days.Precipitation === -990">-99 mm</span>
                <span v-else>{{ `${row.RainfallElement.Past3days.Precipitation} mm` }}
                  <img src="@/assets/observationData/autoStationRainWeather/rain.png" alt="降雨量"
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
import { onMounted, ref, computed, watch } from "vue"
// 引入接口以及接口type
import { getAutoStationRainWeatherForecast } from "@/apis/observationData/index"
import type { autoStationRainWeatherData, Station } from '@/apis/observationData/type/autoStationRain'
// 引入倉庫
import { useAutoStationRainWeatherStore } from '@/stores/observationData/autoStationRainWeather'
const autoStationRainWeatherStore = useAutoStationRainWeatherStore()
// 接收當前天氣的資料
const autoStationRainWeather = ref<Station[]>([])
// 引入東南西北地區
const north: string[] = ['臺北市', '新北市', '基隆市', '新竹市', '桃園市', '新竹縣', '宜蘭縣']
const mid: string[] = ['臺中市', '苗栗縣', '彰化縣', '南投縣', '雲林縣']
const south: string[] = ['高雄市', '臺南市', '嘉義市', '嘉義縣', '屏東縣']
const east: string[] = ['花蓮縣', '臺東縣']
const out: string[] = ['金門縣', '連江縣', '澎湖縣']
// 篩選區域
const filter = computed(() => {
  const filterByArea = (area: string[]) => autoStationRainWeather.value.filter(item => area.includes(item.GeoInfo.CountyName));

  let filteredWeather: Station[] = []

  if (autoStationRainWeatherStore.east) {
    filteredWeather = filteredWeather.concat(filterByArea(east));
  }
  if (autoStationRainWeatherStore.south) {
    filteredWeather = filteredWeather.concat(filterByArea(south));
  }
  if (autoStationRainWeatherStore.mid) {
    filteredWeather = filteredWeather.concat(filterByArea(mid));
  }
  if (autoStationRainWeatherStore.north) {
    filteredWeather = filteredWeather.concat(filterByArea(north));
  }
  if (autoStationRainWeatherStore.out) {
    filteredWeather = filteredWeather.concat(filterByArea(out));
  }
  if (!autoStationRainWeatherStore.east && !autoStationRainWeatherStore.south && !autoStationRainWeatherStore.mid && !autoStationRainWeatherStore.north && !autoStationRainWeatherStore.out) {
    reqAutoStationRainWeatherForecast();
  }
  return filteredWeather
});
// 監聽使用者選擇的地區
watch(() =>
  [autoStationRainWeatherStore.east, autoStationRainWeatherStore.south, autoStationRainWeatherStore.mid, autoStationRainWeatherStore.north, autoStationRainWeatherStore.out]
  , () => {
    autoStationRainWeather.value = filter.value
    reqAutoStationRainWeatherForecast()
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
  reqAutoStationRainWeatherForecast()
}
// 控制currentPage
const handleCurrentChange = (page: number) => {
  autoStationRainWeatherStore.pages = page
  currentPage.value = page
}
// 計算分頁後要渲染的資料
const sliceAutoStationRainWeather = computed(() => {
  return searchAutoStationRainWeather.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})
// 搜尋功能
const cityKeyword = ref<string>('')
const districtKeyword = ref<string>('')
const stationKeyword = ref<string>('')
// 計算搜尋關鍵字的資料
const searchAutoStationRainWeather = computed(() => {
  return autoStationRainWeather.value.filter((item) => {
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
watch(searchAutoStationRainWeather, () => {
  if (cityKeyword.value === '' && districtKeyword.value === '' && stationKeyword.value === '') {
    total.value = autoStationRainWeather.value.length
  } else {
    total.value = searchAutoStationRainWeather.value.length
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
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.GeoInfo.CountyName.localeCompare(a.GeoInfo.CountyName)
  })
}
const sortByCountyNameDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.GeoInfo.CountyName.localeCompare(b.GeoInfo.CountyName)
  })
}
// 按照鄉鎮名稱排序
const sortByTownNameUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.GeoInfo.TownName.localeCompare(a.GeoInfo.TownName)
  })
}
const sortByTownNameDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.GeoInfo.TownName.localeCompare(b.GeoInfo.TownName)
  })
}
// 按照測量站名稱排序
const sortByStationNameUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.StationName.localeCompare(a.StationName)
  })
}
const sortByStationNameDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.StationName.localeCompare(b.StationName)
  })
}
// 按照當前累積降雨量排序
const sortByNowPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Now.Precipitation - a.RainfallElement.Now.Precipitation
  })
}
const sortByNowPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Now.Precipitation - b.RainfallElement.Now.Precipitation
  })
}
// 按照過去十分鐘累積降雨量排序
const sortByPast10MinPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past10Min.Precipitation - a.RainfallElement.Past10Min.Precipitation
  })
}
const sortByPast10MinPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past10Min.Precipitation - b.RainfallElement.Past10Min.Precipitation
  })
}
// 按照過去一小時累積降雨量排序
const sortByPast1hrPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past1hr.Precipitation - a.RainfallElement.Past1hr.Precipitation
  })
}
const sortByPast1hrPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past1hr.Precipitation - b.RainfallElement.Past1hr.Precipitation
  })
}
// 按照過去三小時累積降雨量排序
const sortByPast3hrPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past3hr.Precipitation - a.RainfallElement.Past3hr.Precipitation
  })
}
const sortByPast3hrPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past3hr.Precipitation - b.RainfallElement.Past3hr.Precipitation
  })
}
// 按照過去六小時累積降雨量排序
const sortByPast6HrPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past6Hr.Precipitation - a.RainfallElement.Past6Hr.Precipitation
  })
}
const sortByPast6HrPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past6Hr.Precipitation - b.RainfallElement.Past6Hr.Precipitation
  })
}
// 按照過去十二小時累積降雨量排序
const sortByPast12hrPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past12hr.Precipitation - a.RainfallElement.Past12hr.Precipitation
  })
}
const sortByPast12hrPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past12hr.Precipitation - b.RainfallElement.Past12hr.Precipitation
  })
}
// 按照過去一天累積降雨量排序
const sortByPast24hrPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past24hr.Precipitation - a.RainfallElement.Past24hr.Precipitation
  })
}
const sortByPast24hrPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past24hr.Precipitation - b.RainfallElement.Past24hr.Precipitation
  })
}
// 按照過去兩天累積降雨量排序
const sortByPast2daysPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past2days.Precipitation - a.RainfallElement.Past2days.Precipitation
  })
}
const sortByPast2daysPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past2days.Precipitation - b.RainfallElement.Past2days.Precipitation
  })
}
// 按照過去三天累積降雨量排序
const sortByPast3daysPrecipitationUp = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return b.RainfallElement.Past3days.Precipitation - a.RainfallElement.Past3days.Precipitation
  })
}
const sortByPast3daysPrecipitationDown = () => {
  autoStationRainWeather.value.sort((a: any, b: any) => {
    return a.RainfallElement.Past3days.Precipitation - b.RainfallElement.Past3days.Precipitation
  })
}
// 獲取當前天氣資料
const reqAutoStationRainWeatherForecast = async () => {
  const res: autoStationRainWeatherData = await getAutoStationRainWeatherForecast()
  autoStationRainWeather.value = res.data.records.Station
  if (autoStationRainWeatherStore.east || autoStationRainWeatherStore.south || autoStationRainWeatherStore.mid || autoStationRainWeatherStore.north || autoStationRainWeatherStore.out) {
    autoStationRainWeather.value = filter.value
  }
  loading.value = false
}
// 刷新後渲染當前天氣資料
onMounted(() => {
  reqAutoStationRainWeatherForecast()
})
</script>

<style scoped lang="scss">
.search {
  display: flex;
  justify-content: center;
  align-items: center;

  .centerSearch {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 25px;
  }

  .districtSearch {
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
@media (max-width: 1280px) {
  .search {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .centerSearch {
      margin: 10px;
    }

    .stationSearch {
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

  .tag {
    .content {
      font-size: 12px;
    }
  }
}

// 1024px以下
@media (max-width: 1024px) {
  .tag {
    .content {
      font-size: 11px;
    }
  }
}

// 980px以上
@media (min-width: 981px) {
  .tag {
    .contentRwd {
      display: none;
    }
  }
}

// 980px以下
@media (max-width: 980px) {
  .tag {
    height: 140px;

    .content {
      display: none;
    }

    .contentRwd {
      font-size: 14px;
    }
  }
}

// 680px以下
@media (max-width: 680px) {
  .tag {
    .title {
      font-size: 20px;
    }

    height: 140px;

    .content {
      display: none;
    }

    .contentRwd {
      font-size: 9px;
    }
  }
}

// 414px以上
@media (min-width: 415px) {
  .tag {
    .checkBtnRwd {
      display: none;
    }
  }
}

// 414px以下
@media (max-width: 414px) {
  .tag {
    .checkBtn {
      display: none;
    }

    .contentRwd {
      font-size: 8px;
    }
  }
}

// 375px以下
@media (max-width: 375px) {
  .tag {
    .title {
      font-size: 14px;
    }

    font-size: 12px;

    .contentRwd {
      font-size: 6px;
    }
  }
}
</style>