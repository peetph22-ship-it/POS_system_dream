import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

// Thai locale with Buddhist-era years, e.g. dayjs().format('D MMM BBBB').
export default defineNuxtPlugin(() => {
  dayjs.extend(buddhistEra)
  dayjs.locale('th')
})
