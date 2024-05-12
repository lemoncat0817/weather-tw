// 獲取當前時間
export const getTime = () => {
  const hours = new Date().getHours()
  if (hours >= 6 && hours < 18) {
    return '今天白天'
  } else if (hours >= 18 || hours <= 6) {
    return '今晚明晨'
  }
}

export const getTime2 = () => {
  const hours = new Date().getHours()
  if (hours >= 6 && hours < 18) {
    return '今晚明晨'
  } else if (hours >= 18 || hours <= 6) {
    return '明天白天'
  }
}

export const getTime3 = () => {
  const hours = new Date().getHours()
  if (hours >= 6 && hours < 18) {
    return '明天白天'
  } else if (hours >= 18 || hours <= 6) {
    return '明天晚上'
  }
}

