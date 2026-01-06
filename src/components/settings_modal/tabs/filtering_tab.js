import { cloneDeep } from 'lodash'
import { mapState, mapActions } from 'pinia'
import { mapState as mapVuexState } from 'vuex'
import { v4 as uuidv4 } from 'uuid'

import { useServerSideStorageStore } from 'src/stores/serverSideStorage'
import { useInterfaceStore } from 'src/stores/interface'

import {
  newImporter,
  newExporter,
} from 'src/services/export_import/export_import.js'

import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import UnitSetting from '../helpers/unit_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import HelpIndicator from '../helpers/help_indicator.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const SUPPORTED_TYPES = new Set(['word', 'regexp', 'user', 'user_regexp'])

const FilteringTab = {
  data() {
    return {
      replyVisibilityOptions: ['all', 'following', 'self'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.reply_visibility_${mode}`),
      })),
      muteBlockLv1Options: ['ask', 'forever', 'temporarily'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`user_card.mute_block_${mode}`),
      })),
      muteFiltersDraftObject: cloneDeep(
        useServerSideStorageStore().prefsStorage.simple.muteFilters,
      ),
      muteFiltersDraftDirty: Object.fromEntries(
        Object.entries(
          useServerSideStorageStore().prefsStorage.simple.muteFilters,
        ).map(([k]) => [k, false]),
      ),
      exportedFilter: null,
      filterImporter: newImporter({
        validator(parsed) {
          if (Array.isArray(parsed)) return false
          if (!SUPPORTED_TYPES.has(parsed.type)) return false
          return true
        },
        onImport: (data) => {
          const {
            enabled = true,
            expires = null,
            hide = false,
            name = '',
            value = '',
          } = data

          this.createFilter({
            enabled,
            expires,
            hide,
            name,
            value,
          })
        },
        onImportFailure(result) {
          console.error('Failure importing filter:', result)
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'settings.filter.import_failure',
            level: 'error',
          })
        },
      }),
      filterExporter: newExporter({
        filename: 'pleromafe_mute-filter',
        getExportedObject: () => this.exportedFilter,
      }),
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    UnitSetting,
    IntegerSetting,
    Checkbox,
    Select,
    HelpIndicator,
  },
  computed: {
    instanceSpecificPanelPresent() {
      return this.$store.state.instance.showInstanceSpecificPanel
    },
    ...SharedComputedObject(),
    ...mapState(useServerSideStorageStore, {
      muteFilters: (store) =>
        Object.entries(store.prefsStorage.simple.muteFilters),
      muteFiltersObject: (store) => store.prefsStorage.simple.muteFilters,
    }),
    ...mapVuexState({
      blockExpirationSupported: (state) => state.instance.blockExpiration,
    }),
    onMuteDefaultActionLv1: {
      get() {
        const value = this.$store.state.config.onMuteDefaultAction
        if (value === 'ask' || value === 'forever') {
          return value
        } else {
          return 'temporarily'
        }
      },
      set(value) {
        let realValue = value
        if (value !== 'ask' && value !== 'forever') {
          realValue = '14d'
        }
        this.$store.dispatch('setOption', {
          name: 'onMuteDefaultAction',
          value: realValue,
        })
      },
    },
    onBlockDefaultActionLv1: {
      get() {
        const value = this.$store.state.config.onBlockDefaultAction
        if (value === 'ask' || value === 'forever') {
          return value
        } else {
          return 'temporarily'
        }
      },
      set(value) {
        let realValue = value
        if (value !== 'ask' && value !== 'forever') {
          realValue = '14d'
        }
        this.$store.dispatch('setOption', {
          name: 'onBlockDefaultAction',
          value: realValue,
        })
      },
    },
    muteFiltersDraft() {
      return Object.entries(this.muteFiltersDraftObject)
    },
    muteFiltersExpired() {
      const now = Date.now()
      return Object.entries(this.muteFiltersDraftObject).filter(
        ([, { expires }]) => expires != null && expires <= now,
      )
    },
  },
  methods: {
    ...mapActions(useServerSideStorageStore, [
      'setPreference',
      'unsetPreference',
      'pushServerSideStorage',
    ]),
    getDatetimeLocal(timestamp) {
      const date = new Date(timestamp)
      const fmt = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 })
      const datetime = [
        date.getFullYear(),
        '-',
        fmt.format(date.getMonth() + 1),
        '-',
        fmt.format(date.getDate()),
        'T',
        fmt.format(date.getHours()),
        ':',
        fmt.format(date.getMinutes()),
      ].join('')
      return datetime
    },
    checkRegexValid(id) {
      const filter = this.muteFiltersObject[id]
      if (filter.type !== 'regexp') return true
      if (filter.type !== 'user_regexp') return true
      const { value } = filter
      let valid = true
      try {
        new RegExp(value)
      } catch {
        valid = false
        console.error('Invalid RegExp: ' + value)
      }
      return valid
    },
    createFilter(
      filter = {
        type: 'word',
        value: '',
        name: 'New Filter',
        enabled: true,
        expires: null,
        hide: false,
      },
    ) {
      const newId = uuidv4()

      filter.order = this.muteFilters.length + 2
      this.muteFiltersDraftObject[newId] = filter
      this.setPreference({ path: 'simple.muteFilters.' + newId, value: filter })
      this.pushServerSideStorage()
    },
    exportFilter(id) {
      this.exportedFilter = { ...this.muteFiltersDraftObject[id] }
      delete this.exportedFilter.order
      this.filterExporter.exportData()
    },
    importFilter() {
      this.filterImporter.importData()
    },
    copyFilter(id) {
      const filter = { ...this.muteFiltersDraftObject[id] }
      const newId = uuidv4()

      this.muteFiltersDraftObject[newId] = filter
      this.setPreference({ path: 'simple.muteFilters.' + newId, value: filter })
      this.pushServerSideStorage()
    },
    deleteFilter(id) {
      delete this.muteFiltersDraftObject[id]
      this.unsetPreference({ path: 'simple.muteFilters.' + id, value: null })
      this.pushServerSideStorage()
    },
    purgeExpiredFilters() {
      this.muteFiltersExpired.forEach(([id]) => {
        delete this.muteFiltersDraftObject[id]
        this.unsetPreference({ path: 'simple.muteFilters.' + id, value: null })
      })
      this.pushServerSideStorage()
    },
    updateFilter(id, field, value) {
      const filter = { ...this.muteFiltersDraftObject[id] }
      if (field === 'expires-never') {
        if (!value) {
          const offset = 1000 * 60 * 60 * 24 * 14 // 2 weeks
          const date = Date.now() + offset
          filter.expires = date
        } else {
          filter.expires = null
        }
      } else if (field === 'expires') {
        const parsed = Date.parse(value)
        filter.expires = parsed.valueOf()
      } else {
        filter[field] = value
      }
      this.muteFiltersDraftObject[id] = filter
      this.muteFiltersDraftDirty[id] = true
    },
    saveFilter(id) {
      this.setPreference({
        path: 'simple.muteFilters.' + id,
        value: this.muteFiltersDraftObject[id],
      })
      this.pushServerSideStorage()
      this.muteFiltersDraftDirty[id] = false
    },
  },
  // Updating nested properties
  watch: {
    replyVisibility() {
      this.$store.dispatch('queueFlushAll')
    },
  },
}

export default FilteringTab
