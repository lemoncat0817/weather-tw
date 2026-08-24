// 36小時預報分成三個時段，時段文字依「現在是白天還是晚上」往後推移一格：
// 白天時：今天白天 / 今晚明晨 / 明天白天
// 晚上時：今晚明晨 / 明天白天 / 明天晚上
const TIME_SLOT_LABELS = ['今天白天', '今晚明晨', '明天白天', '明天晚上'] as const

// 取得第 offset 個時段（0、1、2）目前應顯示的文字
export const getTimeLabel = (offset: 0 | 1 | 2): string => {
  const hours = new Date().getHours()
  const isDaytime = hours >= 6 && hours < 18
  return isDaytime ? TIME_SLOT_LABELS[offset] : TIME_SLOT_LABELS[offset + 1]
}
