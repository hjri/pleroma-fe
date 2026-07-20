import { useMergedConfigStore } from 'src/stores/merged_config.js'

import * as DateUtils from 'src/services/date_utils/date_utils.js'
import localeService from 'src/services/locale/locale.service.js'

export default {
  name: 'Timeago',
  props: ['time', 'autoUpdate', 'longFormat', 'nowThreshold', 'templateKey'],
  data() {
    return {
      relativeTimeMs: 0,
      relativeTime: { key: 'time.now', num: 0 },
      interval: null,
    }
  },
  computed: {
    shouldUseAbsoluteTimeFormat() {
      if (!useMergedConfigStore().mergedConfig.useAbsoluteTimeFormat) {
        return false
      }
      return (
        DateUtils.durationStrToMs(
          useMergedConfigStore().mergedConfig.absoluteTimeFormatMinAge,
        ) <= this.relativeTimeMs
      )
    },
    time12hFormat() {
      return useMergedConfigStore().mergedConfig.absoluteTimeFormat12h === '12h'
    },
    browserLocale() {
      return localeService.internalToBrowserLocale(this.$i18n.locale)
    },
    timeAsDate() {
      return typeof this.time === 'string'
        ? new Date(Date.parse(this.time))
        : this.time
    },
    localeDateString() {
      return this.timeAsDate.toLocaleString(this.browserLocale)
    },
    relativeTimeString() {
      const timeString = this.$i18n.t(
        this.relativeTime.key,
        [this.relativeTime.num],
        this.relativeTime.num,
      )

      if (
        typeof this.templateKey === 'string' &&
        this.relativeTime.key !== 'time.now'
      ) {
        return this.$i18n.t(this.templateKey, [timeString])
      }

      return timeString
    },
    absoluteTimeString() {
      if (this.longFormat) {
        return this.localeDateString
      }
      const now = new Date()
      const formatter = (() => {
        if (DateUtils.isSameDay(this.timeAsDate, now)) {
          return new Intl.DateTimeFormat(this.browserLocale, {
            minute: 'numeric',
            hour: 'numeric',
            hour12: this.time12hFormat,
          })
        } else if (DateUtils.isSameMonth(this.timeAsDate, now)) {
          return new Intl.DateTimeFormat(this.browserLocale, {
            month: 'short',
            day: 'numeric',
            hour12: this.time12hFormat,
          })
        } else if (DateUtils.isSameYear(this.timeAsDate, now)) {
          return new Intl.DateTimeFormat(this.browserLocale, {
            month: 'short',
            day: 'numeric',
            hour12: this.time12hFormat,
          })
        } else {
          return new Intl.DateTimeFormat(this.browserLocale, {
            year: 'numeric',
            month: 'short',
            hour12: this.time12hFormat,
          })
        }
      })()

      return formatter.format(this.timeAsDate)
    },
    relativeOrAbsoluteTimeString() {
      return this.shouldUseAbsoluteTimeFormat
        ? this.absoluteTimeString
        : this.relativeTimeString
    },
  },
  watch: {
    time(newVal, oldVal) {
      if (oldVal !== newVal) {
        clearTimeout(this.interval)
        this.refreshRelativeTimeObject()
      }
    },
  },
  created() {
    this.refreshRelativeTimeObject()
  },
  unmounted() {
    clearTimeout(this.interval)
  },
  methods: {
    refreshRelativeTimeObject() {
      const nowThreshold =
        typeof this.nowThreshold === 'number' ? this.nowThreshold : 1
      this.relativeTimeMs = DateUtils.relativeTimeMs(this.time)
      this.relativeTime = this.longFormat
        ? DateUtils.relativeTime(this.time, nowThreshold)
        : DateUtils.relativeTimeShort(this.time, nowThreshold)

      if (this.autoUpdate) {
        this.interval = setTimeout(
          this.refreshRelativeTimeObject,
          1000 * this.autoUpdate,
        )
      }
    },
  },
}
