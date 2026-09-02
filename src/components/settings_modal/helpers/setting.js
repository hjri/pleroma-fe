import { cloneDeep, get, isEqual, set } from 'lodash'

import DraftButtons from './draft_buttons.vue'
import LocalSettingIndicator from './local_setting_indicator.vue'
import ModifiedIndicator from './modified_indicator.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useProfileConfigStore } from 'src/stores/profile_config.js'

export default {
  components: {
    ModifiedIndicator,
    DraftButtons,
    LocalSettingIndicator,
  },
  props: {
    modelValue: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    path: {
      type: [String, Array],
      required: false,
    },
    showDescription: {
      type: Boolean,
      required: false,
    },
    descriptionPathOverride: {
      type: [String, Array],
      required: false,
    },
    suggestions: {
      type: [String, Array],
      required: false,
    },
    subgroup: {
      type: String,
      required: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    local: {
      type: Boolean,
      default: false,
    },
    parentPath: {
      type: [String, Array],
    },
    parentInvert: {
      type: Boolean,
      default: false,
    },
    expert: {
      type: [Number, String],
      default: 0,
    },
    source: {
      type: String,
      default: undefined,
    },
    hideDraftButtons: {
      // this is for the weird backend hybrid (Boolean|String or Boolean|Number) settings
      required: false,
      type: Boolean,
    },
    hideLabel: {
      type: Boolean,
    },
    hideDescription: {
      type: Boolean,
    },
    swapDescriptionAndLabel: {
      type: Boolean,
    },
    backendDescriptionPath: {
      type: [String, Array],
    },
    overrideBackendDescription: {
      type: Boolean,
    },
    overrideBackendDescriptionLabel: {
      type: [Boolean, String],
    },
    draftMode: {
      type: Boolean,
      default: undefined,
    },
    timedApplyMode: {
      type: Boolean,
      default: false,
    },
  },
  inject: {
    defaultSource: {
      default: 'default',
    },
    defaultDraftMode: {
      default: false,
    },
  },
  data() {
    return {
      localDraft: null,
    }
  },
  emits: ['update:modelValue'],
  created() {
    if (
      this.realDraftMode &&
      (this.realSource !== 'admin' || this.path == null)
    ) {
      this.draft = cloneDeep(this.state)
    }
  },
  computed: {
    draft: {
      get() {
        if (this.realSource === 'admin' || this.path == null) {
          return get(useAdminSettingsStore().draft, this.canonPath)
        } else {
          return this.localDraft
        }
      },
      set(value) {
        if (this.realSource === 'admin' || this.path == null) {
          useAdminSettingsStore().updateAdminDraft({
            path: this.canonPath,
            value,
          })
        } else {
          this.localDraft = value
        }
      },
    },
    state() {
      if (this.path == null) {
        return this.modelValue
      }
      const value = get(this.configSource, this.canonPath)
      if (value === undefined) {
        return this.defaultState
      } else {
        return value
      }
    },
    visibleState() {
      return this.realDraftMode ? this.draft : this.state
    },
    realSource() {
      return this.source || this.defaultSource
    },
    realDraftMode() {
      return this.draftMode === undefined
        ? this.defaultDraftMode
        : this.draftMode
    },
    backendDescription() {
      return get(useAdminSettingsStore().descriptions, this.descriptionPath)
    },
    backendDescriptionLabel() {
      if (this.realSource !== 'admin') return ''
      if (
        this.overrideBackendDescriptionLabel !== '' &&
        typeof this.overrideBackendDescriptionLabel === 'string'
      ) {
        return this.overrideBackendDescriptionLabel
      }
      if (!this.backendDescription || this.overrideBackendDescriptionLabel) {
        return this.$t(
          [
            'admin_dash',
            'temp_overrides',
            ...this.canonPath.map((p) => p.replaceAll('.', '_DOT_')),
            'label',
          ].join('.'),
        )
      } else {
        return this.swapDescriptionAndLabel
          ? this.backendDescription?.description
          : this.backendDescription?.label
      }
    },
    backendDescriptionDescription() {
      if (this.description) return this.description
      if (this.realSource !== 'admin') return ''
      if (this.hideDescription) return null
      if (!this.backendDescription || this.overrideBackendDescription) {
        return this.$t(
          [
            'admin_dash',
            'temp_overrides',
            ...this.canonPath.map((p) => p.replaceAll('.', '_DOT_')),
            'description',
          ].join('.'),
        )
      } else {
        return this.swapDescriptionAndLabel
          ? this.backendDescription?.label
          : this.backendDescription?.description
      }
    },
    backendDescriptionSuggestions() {
      return this.backendDescription?.suggestions || this.suggestions
    },
    shouldBeDisabled() {
      if (this.path == null) {
        return this.disabled
      }
      let parentValue = null
      if (this.parentPath !== undefined && this.realSource === 'admin') {
        if (this.realDraftMode) {
          parentValue = get(useAdminSettingsStore().draft, this.parentPath)
        } else {
          parentValue = get(this.configSource, this.parentPath)
        }
      }
      return (
        this.disabled ||
        (parentValue !== null
          ? this.parentInvert
            ? parentValue
            : !parentValue
          : false)
      )
    },
    configSource() {
      switch (this.realSource) {
        case 'profile':
          return useProfileConfigStore().config
        case 'admin':
          return useAdminSettingsStore().config
        default:
          return useMergedConfigStore().mergedConfig
      }
    },
    configSink() {
      if (this.path == null) {
        return () => {
          /* no-op */
        }
      }

      switch (this.realSource) {
        case 'profile':
          return (k, v) =>
            useProfileConfigStore().setProfileOption({ name: k, value: v })
        case 'admin':
          return (k, v) =>
            useAdminSettingsStore().pushAdminSetting({ path: k, value: v })
        default:
          return (readPath, value) => {
            const writePath = `${readPath}`

            if (!this.timedApplyMode) {
              if (this.local) {
                useLocalConfigStore().set({
                  path: writePath,
                  value,
                })
              } else {
                useSyncConfigStore().setSimplePrefAndSave({
                  path: writePath,
                  value,
                })
              }
            } else {
              if (useInterfaceStore().temporaryChangesTimeoutId !== null) {
                console.error("Can't track more than one temporary change")
                return
              }

              const oldValue = get(this.configSource, readPath)

              if (this.local) {
                useLocalConfigStore().setTemporarily({ path: writePath, value })
              } else {
                useSyncConfigStore().setPreference({ path: writePath, value })
              }

              const confirm = () => {
                if (this.local) {
                  useLocalConfigStore().set({ path: writePath, value })
                } else {
                  useSyncConfigStore().pushSyncConfig()
                }
                useInterfaceStore().clearTemporaryChanges()
              }

              const revert = () => {
                if (this.local) {
                  useLocalConfigStore().unsetTemporarily({
                    path: writePath,
                    value,
                  })
                } else {
                  useSyncConfigStore().setPreference({
                    path: writePath,
                    value: oldValue,
                  })
                }
                useInterfaceStore().clearTemporaryChanges()
              }

              useInterfaceStore().setTemporaryChanges({ confirm, revert })
            }
          }
      }
    },
    defaultState() {
      switch (this.realSource) {
        case 'profile':
          return {}
        default: {
          return get(useMergedConfigStore().mergedConfigDefault, this.path)
        }
      }
    },
    isProfileSetting() {
      return this.realSource === 'profile'
    },
    isLocalSetting() {
      return this.local
    },
    isChanged() {
      if (this.path == null) return false
      switch (this.realSource) {
        case 'profile':
        case 'admin':
          return false
        default:
          return this.state !== this.defaultState
      }
    },
    canonPath() {
      if (this.path == null) return null
      return Array.isArray(this.path) ? this.path : this.path.split('.')
    },
    descriptionPath() {
      if (this.path == null) return null
      if (this.descriptionPathOverride) return this.descriptionPathOverride
      const path = Array.isArray(this.path) ? this.path : this.path.split('.')
      if (this.subgroup) {
        return [
          ...path.slice(0, path.length - 1),
          ':subgroup,' + this.subgroup,
          ...path.slice(path.length - 1),
        ]
      }
      return path
    },
    isDirty() {
      if (this.path == null) return false
      if (this.realSource === 'admin' && this.canonPath.length > 3) {
        return false // should not show draft buttons for "grouped" values
      } else {
        return this.realDraftMode && !isEqual(this.draft, this.state)
      }
    },
    canHardReset() {
      return (
        this.realSource === 'admin' &&
        useAdminSettingsStore().modifiedPaths?.has(this.canonPath.join(' -> '))
      )
    },
    matchesExpertLevel() {
      const settingExpertLevel = this.expert || 0
      const userToggleExpert =
        useMergedConfigStore().mergedConfig.expertLevel || 0

      return settingExpertLevel <= userToggleExpert
    },
  },
  methods: {
    getValue(e) {
      return e.target.value
    },
    update(e) {
      if (this.realDraftMode) {
        this.draft = this.getValue(e)
      } else {
        this.$emit('update:modelValue', this.getValue(e))
        this.configSink(this.path, this.getValue(e))
      }
    },
    commitDraft() {
      if (this.realDraftMode) {
        this.$emit('update:modelValue', this.draft)
        this.configSink(this.path, this.draft)
      }
    },
    reset() {
      if (this.realDraftMode) {
        this.draft = cloneDeep(this.state)
      } else {
        set(
          useMergedConfigStore().mergedConfig,
          this.path,
          cloneDeep(this.defaultState),
        )
      }
    },
    hardReset() {
      switch (this.realSource) {
        case 'admin':
          return useAdminSettingsStore().resetAdminSetting({ path: this.path })
            .then(() => {
              this.draft = this.state
            })
        default:
          console.warn('Hard reset not implemented yet!')
      }
    },
  },
}
