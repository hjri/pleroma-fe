<template>
  <time>
    {{ displayDate }}
  </time>
</template>

<script>
import { useMergedConfigStore } from 'src/stores/merged_config.js'

import localeService from 'src/services/locale/locale.service.js'

export default {
  name: 'Timeago',
  props: ['date', 'showTime'],
  computed: {
    time12hFormat() {
      return useMergedConfigStore().mergedConfig.absoluteTimeFormat12h === '12h'
    },
    displayDate() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (this.date.getTime() === today.getTime()) {
        return this.$t('display_date.today')
      } else {
        if (this.showTime) {
          return this.date.toLocaleTimeString(
            localeService.internalToBrowserLocale(this.$i18n.locale),
            { hour12: this.time12hFormat, hour: 'numeric', minute: 'numeric' },
          )
        } else {
          return this.date.toLocaleDateString(
            localeService.internalToBrowserLocale(this.$i18n.locale),
            { day: 'numeric', month: 'long' },
          )
        }
      }
    },
  },
}
</script>
