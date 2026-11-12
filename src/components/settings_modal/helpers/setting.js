import { cloneDeep, get, isEqual, set } from 'lodash-es'
import { useId } from 'vue'

import DraftButtons from './draft_buttons.vue'
import SettingIndicators from './setting_indicators.vue'
import ModifiedIndicator from './modified_indicator.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import {
  INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
  LOCAL_DEFAULT_CONFIG_DEFINITIONS,
} from 'src/stores/default_state/default_config_state.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useProfileConfigStore } from 'src/stores/profile_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

export default {
  components: {
    ModifiedIndicator,
    DraftButtons,
    SettingIndicators,
  },
  props: {
    // # Main props.
    // Path to a setting
    path: {
      type: [String, Array],
      required: false,
    },
    // What store setting resides in
    source: {
      type: String,
      default: undefined,
    },
    // Whether setting is meant to be an "expert" one
    expert: {
      type: Number,
      default: undefined,
    },
    // Backend admin thing
    subgroup: {
      type: String,
      required: false,
    },
    // Whether to use draft mode, i.e. writing to a draft first instead of real storage
    draftMode: {
      type: Boolean,
      default: undefined,
    },
    // When changing setting, apply it temporarily and let user confirm the change
    // or revert after a timeout. Only supported in sync/local sources
    timed: {
      type: Boolean,
      default: undefined,
    },

    // ## Option dependency
    // Path of a "parent" setting
    parentPath: {
      type: [String, Array],
    },
    // Whether to disable setting when parent is true instead of false
    parentInvert: {
      type: Boolean,
      default: undefined,
    },

    // # Direct mode
    // using local state instead of storage when path=null
    modelValue: {
      type: String,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },

    // # Admin settings labels/descriptions
    suggestions: {
      type: [String, Array],
      required: false,
    },
    description: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      default: null,
    },
    descriptionPathOverride: {
      type: [String, Array],
      required: false,
    },
    swapDescriptionAndLabel: {
      type: Boolean,
    },

    // Override labels, for cases where they are incorrect or confusing
    overrideBackendDescription: {
      type: Boolean,
    },
    overrideBackendDescriptionLabel: {
      type: [Boolean, String],
    },

    // # Text and supporting components
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
  },
  inject: {
    defaultSource: {
      default: 'sync',
    },
    defaultDraftMode: {
      default: false,
    },
  },
  setup() {
    const uniqueId = useId()

    return { uniqueId }
  },
  data() {
    return {
      localDraft: null,
    }
  },
  emits: ['update:modelValue'],
  created() {
    if (!this.realDraftMode) return
    if (this.realSource !== 'admin' || this.path == null) {
      this.draft = cloneDeep(this.state)
    }
  },
  computed: {
    // Normalized props
    canonPath() {
      if (this.path == null) return null
      return Array.isArray(this.path) ? this.path : this.path.split('.')
    },
    descriptionPath() {
      if (this.path == null) return null
      const data = this.descriptionPathOverride ?? this.path
      const path = Array.isArray(data) ? data : data.split('.')
      if (this.subgroup) {
        return [
          ...path.slice(0, path.length - 1),
          ':subgroup,' + this.subgroup,
          ...path.slice(path.length - 1),
        ]
      }
      return path
    },
    realSource() {
      return this.source || this.defaultSource
    },
    realDraftMode() {
      return this.draftMode ?? this.defaultDraftMode
    },
    realTimed() {
      return this.timed ?? this.definition?.timed
    },

    // Main state
    draft: {
      get() {
        if (this.realSource === 'admin') {
          return get(useAdminSettingsStore().draft, this.canonPath)
        } else {
          return this.localDraft
        }
      },
      set(value) {
        if (this.realSource === 'admin') {
          useAdminSettingsStore().updateAdminDraft({
            path: this.canonPath,
            value,
          })
        } else {
          this.localDraft = value
        }
      },
    },
    state: {
      get() {
        if (this.path == null) return this.modelValue

        const value = get(this.realSource, this.canonPath)
        if (value === undefined) {
          return this.defaultState
        } else {
          return value
        }
      },
      set(value) {
        this.$emit('update:modelValue')
        this.configSink(this.path, value)
      },
    },
    visibleState: {
      get() {
        if (this.realDraftMode) {
          return this.draft
        } else {
          return this.state
        }
      },
      set(value) {
        if (this.realDraftMode) {
          this.draft = this.getValue(value)
        } else {
          this.state = this.getValue(value)
        }
      },
    },

    // Data access
    configSource() {
      switch (this.realSource) {
        case 'profile':
          return useProfileConfigStore().config
        case 'admin':
          return useAdminSettingsStore().config
        case 'fe-admin':
          return useAdminSettingsStore().frontendConfig
        case 'local':
          return useLocalConfigStore().mergedConfig
        default: // local-only also get data from merged config!
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
          return (path, value) =>
            useProfileConfigStore().setProfileOption({ name: path, value })
        case 'admin':
          return (path, value) =>
            useAdminSettingsStore().pushAdminSetting({ path, value })
        case 'fe-admin':
          return (path, value) => {
            const prefix = [
              ':pleroma',
              ':frontend_configurations',
              ':pleroma_fe',
            ]
            const settings = cloneDeep(useAdminSettingsStore().frontendConfig)
            set(settings, path, value)
            const formatted = Object.fromEntries(
              Object.entries(settings).map(([k, v]) => [`:${k}`, v]),
            )

            useAdminSettingsStore().pushAdminSetting({
              path: prefix.join('.'),
              value: formatted,
            })
          }
        default:
          return (path, value) => {
            if (!this.realTimed) {
              if (this.realSource === 'local' || this.isLocalOnly) {
                useLocalConfigStore().set({
                  path,
                  value,
                })
              } else {
                useSyncConfigStore().setSimplePrefAndSave({
                  path,
                  value,
                })
              }
            } else {
              if (useInterfaceStore().temporaryChangesTimeoutId !== null) {
                console.error("Can't track more than one temporary change")
                return
              }

              const oldValue = get(this.configSource, path)
              if (this.realSource === 'local' || this.isLocalOnly) {
                useLocalConfigStore().setTemporarily({ path, value })
              } else {
                useSyncConfigStore().setPreference({ path, value })
              }

              const confirm = () => {
                if (this.realSource === 'local' || this.isLocalOnly) {
                  useLocalConfigStore().set({ path, value })
                  useLocalConfigStore().unsetTemporarily({ path })
                } else {
                  useSyncConfigStore().pushSyncConfig()
                }
                useInterfaceStore().clearTemporaryChanges()
              }

              const revert = () => {
                if (this.realSource === 'local' || this.isLocalOnly) {
                  useLocalConfigStore().unsetTemporarily({ path })
                } else {
                  useSyncConfigStore().setPreference({ path, value: oldValue })
                }
                useInterfaceStore().clearTemporaryChanges()
              }

              useInterfaceStore().setTemporaryChanges({ confirm, revert })
            }
          }
      }
    },
    defaultState() {
      if (this.isLocalOnly) {
        return get(useMergedConfigStore().mergedConfigDefault, this.canonPath)
      }
      switch (this.realSource) {
        case 'profile':
        case 'admin':
          return {}
        case 'local':
        case 'fe-admin':
          return undefined
        default: {
          return get(useMergedConfigStore().mergedConfigDefault, this.canonPath)
        }
      }
    },
    definitions() {
      switch (this.realSource) {
        case 'profile':
        case 'admin':
          return {}
        case 'fe-admin':
        default:
          return {
            ...LOCAL_DEFAULT_CONFIG_DEFINITIONS,
            ...INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
          }
      }
    },

    definition() {
      return get(this.definitions, this.canonPath)
    },

    // Labels & Descriptions
    backendDescription() {
      return get(useAdminSettingsStore().descriptions, this.descriptionPath)
    },
    realLabel() {
      if (this.hideLabel) return ''
      if (this.label) return this.label
      if (this.definition?.label) return this.$t(this.definition?.label)
      if (this.realSource !== 'admin') return ''
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
    realDescription() {
      if (this.hideDescription) return ''
      if (this.description) return this.description
      if (this.realSource !== 'admin') return ''
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
    realSuggestions() {
      return this.suggestions || this.backendDescription?.suggestions
    },
    realPlaceholder() {
      if (this.realSource === 'local' || this.isLocalOnly) {
        return get(useMergedConfigStore().mergedConfig, this.canonPath)
      }
      if (this.realSource === 'fe-admin') {
        return this.definition?.default
      }
      return ''
    },
    realExpert() {
      return this.expert ?? this.definition?.expert ?? 0
    },
    realParentPath() {
      return this.parentPath ?? this.definition?.parent
    },
    realParentInvert() {
      return this.parentInvert ?? this.definition?.parentInvert
    },

    // Supporting misc states
    shouldBeDisabled() {
      if (this.path == null) return this.disabled
      if (this.source === 'profile' && this.defaultSource === 'fe-admin')
        return true

      const parentValue = (() => {
        if (this.realParentPath === undefined) return undefined
        if (this.realSource === 'admin') {
          return get(useAdminSettingsStore().draft, this.realParentPath)
        } else {
          return get(this.configSource, this.realParentPath)
        }
      })()

      if (parentValue === undefined) return this.disabled

      return this.realParentInvert ? parentValue : !parentValue
    },
    isProfileSetting() {
      return this.realSource === 'profile'
    },
    isLocalOnly() {
      return this.definition?.localOnly ?? false
    },
    isChanged() {
      if (this.path == null) return false
      switch (this.realSource) {
        case 'profile':
        case 'admin':
          return false
        default:
          return this.visibleState !== this.defaultState
      }
    },
    isDirty() {
      if (!this.realDraftMode) return false
      if (this.realSource === 'admin' && this.canonPath.length > 3) {
        return false // should not show draft buttons for "grouped" values
      }
      return !isEqual(this.draft, this.state)
    },
    isOverriden() {
      if (this.realSource !== 'sync') return false
      if (this.isLocalOnly) return false
      return (
        get(useLocalConfigStore().prefsStorage, this.canonPath) !== undefined
      )
    },
    isDefined() {
      if (this.realSource !== 'fe-admin' && this.realSource !== 'local') return false
      if (this.isLocalOnly) return false
      return (
        this.visibleState !== undefined
      )
    },
    classes() {
      return {
        faint: this.shouldBeDisabled,
        '-overriden': this.isOverriden,
        '-defined': this.isDefined,
      }
    },
    canHardReset() {
      if (this.isLocalOnly) return false
      switch (this.realSource) {
        case 'admin':
          return useAdminSettingsStore().modifiedPaths?.has(
            this.canonPath.join(' -> '),
          )
        case 'local':
        case 'fe-admin':
          return this.state !== undefined
        default:
          return false
      }
    },
    matchesExpertLevel() {
      const settingExpertLevel = this.realExpert
      const userToggleExpert =
        useMergedConfigStore().mergedConfig.expertLevel || 0

      return settingExpertLevel <= userToggleExpert
    },
    idPrefix() {
      return `setting-${this.uniqueId}-`
    },
  },
  methods: {
    // Function that meant to be overriden by consumers to output
    // correct value given the model-value update event
    getValue(e) {
      return e
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
          return useAdminSettingsStore()
            .resetAdminSetting({ path: this.path })
            .then(() => {
              this.draft = this.state
            })
        default:
          this.visibleState = undefined
      }
    },
  },
}
