import 'dayjs/locale/pt-br'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)
dayjs.locale('pt-br')

export { dayjs }
