// 行政院人事行政總處（DGPA）天然災害停止上班及上課情形 client。
// 官方即時看板提供最新停班停課公告（非颱風天為「無停班停課訊息」），
// 採用 HTML 頁面發布，全台 22 縣市通報統整於此。

const DGPA_NDS_URL = 'https://www.dgpa.gov.tw/typh/daily/nds.html'

export async function fetchDgpaWorkSchoolHtml(): Promise<string> {
  try {
    const html = await $fetch<string>(DGPA_NDS_URL, {
      responseType: 'text',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10_000
    })
    return html
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: '無法連線至行政院人事行政總處天然災害停止上班及上課資訊網',
      cause: err
    })
  }
}
