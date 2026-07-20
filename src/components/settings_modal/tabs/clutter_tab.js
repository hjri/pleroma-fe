import { mapActions, mapState } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import HelpIndicator from '../helpers/help_indicator.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

const ClutterTab = {
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
    ...SharedComputedObject(),
    ...mapState(useInstanceCapabilitiesStore, ['shoutAvailable']),
    ...mapState(useInstanceStore, {
      showFeaturesPanel: (store) => store.instanceIdentity.showFeaturesPanel,
      instanceSpecificPanelPresent: (store) =>
        store.instanceIdentity.showInstanceSpecificPanel &&
        store.instanceIdentity.instanceSpecificPanelContent,
    }),
    ...mapState(useSyncConfigStore, {
      muteFilters: (store) =>
        Object.entries(store.prefsStorage.simple.muteFilters),
      muteFiltersObject: (store) => store.prefsStorage.simple.muteFilters,
    }),
  },
  methods: {
    ...mapActions(useSyncConfigStore, [
      'setSimplePrefAndSave',
      'unsetSimplePrefAndSave',
      'pushSyncConfig',
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
      this.setSimplePrefAndSave({ path: 'muteFilters.' + newId, value: filter })
      this.pushSyncConfig()
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
      this.setSimplePrefAndSave({ path: 'muteFilters.' + newId, value: filter })
      this.pushSyncConfig()
    },
    deleteFilter(id) {
      delete this.muteFiltersDraftObject[id]
      this.unsetSimplePrefAndSave({ path: 'muteFilters.' + id, value: null })
      this.pushSyncConfig()
    },
    purgeExpiredFilters() {
      this.muteFiltersExpired.forEach(([id]) => {
        delete this.muteFiltersDraftObject[id]
        this.unsetSimplePrefAndSave({ path: 'muteFilters.' + id, value: null })
      })
      this.pushSyncConfig()
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
      this.setSimplePrefAndSave({
        path: 'muteFilters.' + id,
        value: this.muteFiltersDraftObject[id],
      })
      this.pushSyncConfig()
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

export default ClutterTab
