import { createHash } from 'node:crypto'

/**
 * Nitro 的 defineCachedEventHandler 會把 getKey 回傳值做檔名安全化處理，
 * 但那個 sanitizer 對中文（含 URL 已編碼過的 %XX 序列）處理得很不乾淨——
 * 實測會把整段中文路徑清空，導致「/api/forecast/臺北市/中正區」和
 * 「/api/forecast/高雄市/前鎮區」這種只有中文不同的路徑全部撞成同一把快取鍵，
 * 使用者查別的縣市卻拿到別人查過的快取結果。
 *
 * 用雜湊值當 key 可以完全避開這個問題：不管路徑含什麼字元，
 * 結果永遠是一段純 hex 字串，不會被任何 sanitizer 誤傷，也幾乎不會碰撞。
 */
export function cacheKeyFor(event: { path: string }): string {
  return createHash('sha1').update(event.path).digest('hex')
}
