import type { ThirtySixHourForecast, ThirtySixHourPeriod, TownForecast, TownForecastHour, TownForecastPeriod } from '#shared/types'

// ---------------------------------------------------------------------------
// F-C0032-001：今明 36 小時預報（縣市層級）
// ---------------------------------------------------------------------------

interface CwaTimeParameter {
  parameterName: string
  parameterValue?: string
  parameterUnit?: string
}
interface CwaTimeEntry {
  startTime: string
  endTime: string
  parameter: CwaTimeParameter
}
interface CwaWeatherElement {
  elementName: string
  time: CwaTimeEntry[]
}
interface CwaThirtySixHourResponse {
  records: {
    location: Array<{
      locationName: string
      weatherElement: CwaWeatherElement[]
    }>
  }
}

function toNumber(value: string | undefined): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function normalizeThirtySixHour(raw: CwaThirtySixHourResponse): ThirtySixHourForecast[] {
  return raw.records.location.map((loc) => {
    const byElement = new Map(loc.weatherElement.map((el) => [el.elementName, el.time]))
    const wx = byElement.get('Wx') ?? []
    const pop = byElement.get('PoP') ?? []
    const minT = byElement.get('MinT') ?? []
    const ci = byElement.get('CI') ?? []
    const maxT = byElement.get('MaxT') ?? []

    const periods: ThirtySixHourPeriod[] = wx.map((entry, i) => ({
      startTime: entry.startTime,
      endTime: entry.endTime,
      weather: entry.parameter.parameterName,
      weatherCode: entry.parameter.parameterValue ?? '',
      pop: pop[i] ? toNumber(pop[i].parameter.parameterName) : null,
      minTemperature: toNumber(minT[i]?.parameter.parameterName),
      maxTemperature: toNumber(maxT[i]?.parameter.parameterName),
      comfortIndex: ci[i]?.parameter.parameterName ?? ''
    }))

    return { locationName: loc.locationName, periods }
  })
}

// ---------------------------------------------------------------------------
// F-D0047-093：鄉鎮逐時 / 延伸預報（用 locationId 指定縣市 dataset + LocationName 指定鄉鎮）
// ---------------------------------------------------------------------------

interface CwaTownElementValue {
  [key: string]: string | undefined
}
interface CwaTownTimeEntry {
  DataTime?: string
  StartTime?: string
  EndTime?: string
  ElementValue: CwaTownElementValue[]
}
interface CwaTownWeatherElement {
  ElementName: string
  Time: CwaTownTimeEntry[]
}
interface CwaTownLocation {
  LocationName: string
  Geocode: string
  Latitude: string
  Longitude: string
  WeatherElement: CwaTownWeatherElement[]
}
interface CwaTownForecastResponse {
  records: {
    Locations: Array<{ Location: CwaTownLocation[] }>
  }
}

function firstValue(entry: CwaTownTimeEntry | undefined): string | undefined {
  if (!entry) return undefined
  const v = entry.ElementValue[0]
  if (!v) return undefined
  return Object.values(v)[0]
}
function valueOf(entry: CwaTownTimeEntry | undefined, key: string): string | undefined {
  return entry?.ElementValue[0]?.[key]
}

/** 3 天版（奇數 dataset）：每小時一筆 */
function toHourly(loc: CwaTownLocation): TownForecastHour[] {
  const byName = new Map(loc.WeatherElement.map((el) => [el.ElementName, el.Time]))
  const temp = byName.get('溫度') ?? []
  const dew = byName.get('露點溫度') ?? []
  const rh = byName.get('相對濕度') ?? []
  const at = byName.get('體感溫度') ?? []
  const ci = byName.get('舒適度指數') ?? []
  const ws = byName.get('風速') ?? []
  const wd = byName.get('風向') ?? []
  const pop = byName.get('3小時降雨機率') ?? []
  const wx = byName.get('天氣現象') ?? []
  const desc = byName.get('天氣預報綜合描述') ?? []

  return temp.map((entry, i) => ({
    time: entry.DataTime ?? entry.StartTime ?? '',
    temperature: toNumber(firstValue(entry)),
    dewPoint: toNumber(firstValue(dew[i])),
    relativeHumidity: toNumber(firstValue(rh[i])),
    apparentTemperature: toNumber(firstValue(at[i])),
    comfortIndex: toNumber(valueOf(ci[i], 'ComfortIndex')),
    comfortDescription: valueOf(ci[i], 'ComfortIndexDescription') ?? '',
    windSpeed: toNumber(firstValue(ws[i])),
    windDirection: firstValue(wd[i]) ?? '',
    pop: pop[i] ? toNumber(firstValue(pop[i])) : null,
    weatherCode: valueOf(wx[i], 'WeatherCode') ?? '',
    weather: valueOf(wx[i], 'Weather') ?? '',
    description: firstValue(desc[i]) ?? ''
  }))
}

/** 1 週版（偶數 dataset）：6 小時一筆 */
function toExtended(loc: CwaTownLocation): TownForecastPeriod[] {
  const byName = new Map(loc.WeatherElement.map((el) => [el.ElementName, el.Time]))
  const avgT = byName.get('平均溫度') ?? []
  const maxT = byName.get('最高溫度') ?? []
  const minT = byName.get('最低溫度') ?? []
  const maxAt = byName.get('最高體感溫度') ?? []
  const minAt = byName.get('最低體感溫度') ?? []
  const pop = byName.get('12小時降雨機率') ?? []
  const wx = byName.get('天氣現象') ?? []
  const uv = byName.get('紫外線指數') ?? []
  const desc = byName.get('天氣預報綜合描述') ?? []

  return avgT.map((entry, i) => ({
    startTime: entry.StartTime ?? '',
    endTime: entry.EndTime ?? '',
    avgTemperature: toNumber(firstValue(entry)),
    maxTemperature: toNumber(firstValue(maxT[i])),
    minTemperature: toNumber(firstValue(minT[i])),
    maxApparentTemperature: toNumber(firstValue(maxAt[i])),
    minApparentTemperature: toNumber(firstValue(minAt[i])),
    pop: pop[i] ? toNumber(firstValue(pop[i])) : null,
    weatherCode: valueOf(wx[i], 'WeatherCode') ?? '',
    weather: valueOf(wx[i], 'Weather') ?? '',
    uvIndex: uv[i] ? toNumber(valueOf(uv[i], 'UVIndex')) : null,
    description: firstValue(desc[i]) ?? ''
  }))
}

export function normalizeTownHourly(raw: CwaTownForecastResponse, county: string): TownForecast | null {
  const loc = raw.records.Locations[0]?.Location[0]
  if (!loc) return null
  return {
    county,
    town: loc.LocationName,
    geocode: loc.Geocode,
    coordinates: { lat: toNumber(loc.Latitude), lon: toNumber(loc.Longitude) },
    hourly: toHourly(loc),
    extended: []
  }
}

export function normalizeTownExtended(raw: CwaTownForecastResponse): TownForecastPeriod[] {
  const loc = raw.records.Locations[0]?.Location[0]
  if (!loc) return []
  return toExtended(loc)
}
