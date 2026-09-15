import type { TsunamiReport } from '#shared/types'

// ---------------------------------------------------------------------------
// E-A0014-001：海嘯資訊資料
// ---------------------------------------------------------------------------

interface CwaTsunamiArea {
  AreaColor: string
  AreaDesc: string
  AreaName: string
  ArrivalTime: string
  InfoStatus: string
  WaveHeight: string
}
interface CwaTsunamiStation {
  ArrivalTime: string
  InfoStatus: string
  StationID: string
  StationName: string
  StationLatitude: number
  StationLongitude: number
  WaveHeight: string
}
interface CwaTsunamiRecord {
  IssueTime: string
  ValidTime?: { EndTime: string }
  ReportColor: string
  ReportContent: string
  ReportNo: string
  ReportType: string
  TsunamiNo: number
  Web?: string
  EarthquakeInfo: {
    OriginTime: string
    Source: string
    FocalDepth: number
    Epicenter: { Location: string; EpicenterLatitude: number; EpicenterLongitude: number }
    EarthquakeMagnitude: { MagnitudeValue: number }
  }
  // 「海嘯消息」（威脅已解除或評估無威脅的通報）實測沒有這個欄位，只有實際評估出威脅時才會出現
  TsunamiWave?: { WarningArea?: CwaTsunamiArea[]; TsuStation?: CwaTsunamiStation[] }
}
interface CwaTsunamiResponse {
  records: { Tsunami: CwaTsunamiRecord[] }
}

/**
 * 跟地震（EarthquakeNo 一次事件一筆）不同，海嘯的 TsunamiNo 是「一場事件」，隨事態發展會有
 * 多筆發布（ReportNo 遞增），這裡不去重、不合併，一筆發布對應一筆 TsunamiReport；id 用
 * TsunamiNo+IssueTime 組合，確保同一事件的不同發布不會撞號。
 */
function toReport(r: CwaTsunamiRecord): TsunamiReport {
  return {
    id: `${r.TsunamiNo}-${r.IssueTime}`,
    tsunamiNo: r.TsunamiNo,
    reportNo: r.ReportNo,
    reportType: r.ReportType,
    reportColor: r.ReportColor,
    reportContent: r.ReportContent,
    issueTime: r.IssueTime,
    validUntil: r.ValidTime?.EndTime ?? null,
    web: r.Web ?? null,
    earthquake: {
      originTime: r.EarthquakeInfo.OriginTime,
      source: r.EarthquakeInfo.Source,
      depthKm: r.EarthquakeInfo.FocalDepth,
      magnitude: r.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue,
      epicenter: { lat: r.EarthquakeInfo.Epicenter.EpicenterLatitude, lon: r.EarthquakeInfo.Epicenter.EpicenterLongitude },
      epicenterDescription: r.EarthquakeInfo.Epicenter.Location
    },
    warningAreas: (r.TsunamiWave?.WarningArea ?? []).map((a) => ({
      areaName: a.AreaName,
      areaDescription: a.AreaDesc,
      areaColor: a.AreaColor,
      arrivalTime: a.ArrivalTime,
      waveHeight: a.WaveHeight,
      infoStatus: a.InfoStatus
    })),
    stations: (r.TsunamiWave?.TsuStation ?? []).map((s) => ({
      stationId: s.StationID,
      stationName: s.StationName,
      position: { lat: s.StationLatitude, lon: s.StationLongitude },
      arrivalTime: s.ArrivalTime,
      waveHeight: s.WaveHeight,
      infoStatus: s.InfoStatus
    }))
  }
}

export function normalizeTsunamiReports(raw: CwaTsunamiResponse): TsunamiReport[] {
  return (raw.records.Tsunami ?? []).map(toReport)
}
