import proj4 from 'proj4'

// TWD97 二度分帶（TM2，EPSG:3826）：中央經線 121°E、GRS80 橢球（跟 WGS84 橢球幾乎一致，
// 差異在公尺以下），橫麥卡托投影、公尺為單位——不是經緯度。水利署河川水位測站站況的
// locationbytwd97_xy 欄位用的就是這個系統，得反算回經緯度才能畫在地圖上，跟空氣品質／
// 水庫那兩支「TWD97 座標直接當經緯度用」的捷徑不同，這裡是真的投影座標，差了兩個數量級
// （值域是幾十萬到幾百萬的公尺數，不是 120 度上下的經緯度）。
// proj4 參數字串取自 EPSG 官方登錄（https://epsg.io/3826.proj4js），沒有自己湊。
proj4.defs(
  'EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
)

/**
 * 把水利署「TWD97 二度分帶」座標字串（如 `"313411.44 2790930.63"`，東距 空白 北距，
 * 公尺）轉成 WGS84 經緯度。格式不合法或缺值時回傳 null，不讓整支 normalizer 掛掉——
 * 呼叫端據此把找不到座標的測站濾掉，不會顯示一個亂猜的位置。
 */
export function twd97Tm2ToWgs84(raw: string | undefined): { lat: number; lon: number } | null {
  if (!raw) return null
  const parts = raw.trim().split(/\s+/).map(Number)
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null
  const [easting, northing] = parts as [number, number]
  const [lon, lat] = proj4('EPSG:3826', 'WGS84', [easting, northing])
  return { lat, lon }
}
