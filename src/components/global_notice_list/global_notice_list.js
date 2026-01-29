import { useInterfaceStore } from 'src/stores/interface.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes)

const GlobalNoticeList = {
  computed: {
    notices() {
      return useInterfaceStore().globalNotices
    },
  },
  methods: {
    closeNotice(notice) {
      useInterfaceStore().removeGlobalNotice(notice)
    },
  },
}

export default GlobalNoticeList
