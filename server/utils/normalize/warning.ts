import type { CountyWarning, WeatherHazard } from '#shared/types'

interface CwaHazardInfo {
  phenomena: string
  significance: string
}
interface CwaHazard {
  info: CwaHazardInfo
  validTime?: { startTime?: string; endTime?: string }
}
interface CwaWarningLocation {
  locationName: string
  hazardConditions?: { hazards?: CwaHazard[] }
}
interface CwaWarningResponse {
  records: { location: CwaWarningLocation[] }
}

export function normalizeCountyWarnings(raw: CwaWarningResponse): CountyWarning[] {
  return raw.records.location.map((loc) => {
    const hazards: WeatherHazard[] = (loc.hazardConditions?.hazards ?? []).map((h) => ({
      phenomena: h.info.phenomena,
      significance: h.info.significance,
      startTime: h.validTime?.startTime ?? null,
      endTime: h.validTime?.endTime ?? null
    }))
    return { county: loc.locationName, hazards }
  })
}
