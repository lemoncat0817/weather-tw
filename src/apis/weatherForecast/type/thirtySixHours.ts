// 36小時數據的type
export type WeatherParameter = {
  parameterName: string
  parameterValue: string
  parameterUnit?: string
}
export type WeatherTime = {
  startTime: string
  endTime: string
  parameter: WeatherParameter
}
export type WeatherElement = {
  elementName: string
  time: WeatherTime[]
}
export type location = {
  locationName: string
  weatherElement: WeatherElement[]
}
export type thirtySixHoursWeatherData = {
  data: {
    success: boolean
    result?: object
    records: {
      datasetDescription: string
      location: location[]
    }
  }
}
