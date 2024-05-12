// 獲取當前日期
export const getDay = (dayOffset = 0) => {
  // 獲取今天的日期
  const today = new Date()

  // 如果指定了日期偏移量，則增加天數
  if (dayOffset) {
    today.setDate(today.getDate() + dayOffset)
  }

  // 從日期對象中獲取月份和日期
  const month = today.getMonth() + 1 // 月份從0開始，所以要加1
  const date = today.getDate()
  const day = today.getDay() // 0-6, 0表示星期日
  const dayList = ['日', '一', '二', '三', '四', '五', '六'] // 定義星期幾的列表

  // 格式化月份和日期，確保單位數補零
  const formattedMonth = month < 10 ? '0' + month : month
  const formattedDate = date < 10 ? '0' + date : date

  // 返回格式化後的日期
  return `${formattedMonth}/${formattedDate} (${dayList[day]})`
}

// 獲取當前日期
export const getDate = (dayOffset = 0) => {
  // 獲取今天的日期
  const today = new Date()

  // 如果指定了日期偏移量，則增加天數
  if (dayOffset) {
    today.setDate(today.getDate() + dayOffset)
  }

  // 從日期對象中獲取月份和日期

  const date = today.getDate()

  // 格式化月份和日期，確保單位數補零
  const formattedDate = date < 10 ? '0' + date : date
  // 返回格式化後的日期
  return formattedDate
}
