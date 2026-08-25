# taiwan-towns.geojson

台灣 368 個鄉鎮市區界線，供 `/map` choropleth 圖層使用。

- **原始資料**：內政部「鄉鎮市區界線(TWD97經緯度)」，來源於政府資料開放平台
- **轉換**：透過 [taiwan-atlas](https://github.com/dkaoster/taiwan-atlas)（MIT）的 pre-built TopoJSON，
  用 `topojson-client` 轉成 GeoJSON，再用 `mapshaper -simplify 8%` 簡化幾何精度（3.3MB → 400KB）
- **屬性欄位**：只保留 `county`（縣市名稱，已把「台」統一正規化成「臺」以對齊 CWA 的縣市命名）與 `town`（鄉鎮市區名稱）
- **授權**：政府資料開放授權條款（比照台灣政府資料開放平台的預設條款）
