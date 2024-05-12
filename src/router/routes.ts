export const constantRoutes = [
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout/index.vue'),
    meta: {
      title: 'layout',
      icon: '',
      hidden: false
    },
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import('@/views/home/index.vue'),
        meta: {
          title: '首頁',
          icon: 'HomeFilled',
          hidden: false
        }
      }
    ]
  },
  {
    path: '/weatherForecast',
    name: 'weatherForecast',
    component: () => import('@/layout/index.vue'),
    meta: {
      title: '氣象預報',
      icon: 'Lightning',
      hidden: false
    },
    redirect: '/weatherForecast/thirtySixHours',
    children: [
      {
        path: '/weatherForecast/thirtySixHours',
        name: 'thirtySixHours',
        component: () => import('@/views/weatherForecast/thirtySixHours/index.vue'),
        meta: {
          title: '今明36小時內天氣預報',
          icon: 'Sunrise',
          hidden: false
        }
      },
      {
        path: '/weatherForecast/threeDays',
        name: 'threeDays',
        component: () => import('@/views/weatherForecast/threeDays/index.vue'),
        meta: {
          title: '未來三天天氣預報',
          icon: 'Sunrise',
          hidden: false
        }
      },
      {
        path: '/weatherForecast/week',
        name: 'week',
        component: () => import('@/views/weatherForecast/week/index.vue'),
        meta: {
          title: '未來一週天氣預報',
          icon: 'Sunrise',
          hidden: false
        }
      },
      {
        path: '/weatherForecast/allTaiwan',
        name: 'allTaiwan',
        component: () => import('@/views/weatherForecast/allTaiwan/index.vue'),
        meta: {
          title: '全臺灣各鄉鎮市區預報',
          icon: 'Sunrise',
          hidden: false
        }
      },
      {
        path: '/weatherForecast/allTaiwanWeek',
        name: 'allTaiwanWeek',
        component: () => import('@/views/weatherForecast/allTaiwanWeek/index.vue'),
        meta: {
          title: '全臺灣各鄉鎮市區(一週)預報',
          icon: 'Sunrise',
          hidden: false
        }
      }
    ]
  },
  {
    path: '/observationData',
    name: 'observationData',
    component: () => import('@/layout/index.vue'),
    meta: {
      title: '氣象觀測資料',
      icon: 'DataAnalysis',
      hidden: false
    },
    redirect: '/observationData/nowWeather',
    children: [
      {
        path: '/observationData/nowWeather',
        name: 'nowWeather',
        component: () => import('@/views/observationData/nowWeather/index.vue'),
        meta: {
          title: '當前天氣觀測資料',
          icon: 'List',
          hidden: false
        }
      },
      {
        path: '/observationData/autoStation',
        name: 'autoStation',
        component: () => import('@/views/observationData/autoStation/index.vue'),
        meta: {
          title: '自動氣象站-氣象觀測資料',
          icon: 'List',
          hidden: false
        }
      },
      {
        path: '/observationData/autoStationRain',
        name: 'autoStationRain',
        component: () => import('@/views/observationData/autoStationRain/index.vue'),
        meta: {
          title: '自動雨量站-雨量觀測資料',
          icon: 'List',
          hidden: false
        }
      },
      {
        path: '/observationData/dailyRainfall',
        name: 'dailyRainfall',
        component: () => import('@/views/observationData/dailyRainfall/index.vue'),
        meta: {
          title: '地面測站-每日雨量資料',
          icon: 'List',
          hidden: false
        }
      }
    ]
  },
  {
    path: '/weatherWarning',
    name: 'weatherWarning',
    component: () => import('@/layout/index.vue'),
    meta: {
      title: '氣象警報',
      icon: 'WarnTriangleFilled',
      hidden: false
    },
    redirect: '/weatherWarning/nowWeatherWarning',
    children: [
      {
        path: '/weatherWarning/nowWeatherWarning',
        name: 'nowWeatherWarning',
        component: () => import('@/views/weatherWarning/nowWeatherWarning/index.vue'),
        meta: {
          title: '各別縣市地區目前天氣警報',
          icon: 'Warning',
          hidden: false
        }
      },
      {
        path: '/weatherWarning/weatherWarningContent',
        name: 'weatherWarningContent',
        component: () => import('@/views/weatherWarning/weatherWarningContent/index.vue'),
        meta: {
          title: '天氣警特報內容',
          icon: 'Warning',
          hidden: false
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/views/404/index.vue'),
    meta: {
      title: '404',
      icon: '',
      hidden: true
    }
  }
]
