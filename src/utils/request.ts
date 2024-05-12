import axios from 'axios'

const request = axios.create({
  baseURL: 'https://opendata.cwa.gov.tw/api',
  timeout: 5000
})

export default request
