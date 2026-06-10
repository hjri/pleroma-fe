import { cloneDeep, isEqual } from 'lodash'
import { mapActions, mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import AsyncComponentError from 'src/components/async_component_error/async_component_error.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import Modal from 'src/components/modal/modal.vue'
import PanelLoading from 'src/components/panel_loading/panel_loading.vue'
import Popover from 'src/components/popover/popover.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import {
  LOCAL_ONLY_KEYS,
  ROOT_CONFIG,
  ROOT_CONFIG_DEFINITIONS,
  validateSetting,
} from 'src/modules/default_config_state.js'
import {
  newExporter,
  newImporter,
} from 'src/services/export_import/export_import.js'
import getResettableAsyncComponent from 'src/services/resettable_async_component.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faWindowMinimize } from '@fortawesome/free-regular-svg-icons'
import {
  faChevronDown,
  faFileDownload,
  faFileUpload,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

const PLEROMAFE_SETTINGS_MAJOR_VERSION = 1
const PLEROMAFE_SETTINGS_MINOR_VERSION = 0

library.add(
  faTimes,
  faWindowMinimize,
  faFileUpload,
  faFileDownload,
  faChevronDown,
)

const SettingsModal = {
  data() {
    return {
      dataImporter: newImporter({
        validator: this.importValidator,
        onImport: this.onImport,
        onImportFailure: this.onImportFailure,
      }),
      dataThemeExporter: newExporter({
        filename: 'pleromafe_settings.full',
        getExportedObject: () => this.generateExport(true),
      }),
      dataExporter: newExporter({
        filename: 'pleromafe_settings',
        getExportedObject: () => this.generateExport(),
      }),
    }
  },
  components: {
    Modal,
    Popover,
    Checkbox,
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),

    SettingsModalUserContent: getResettableAsyncComponent(
      () => import('./settings_modal_user_content.vue'),
      {
        loadingComponent: PanelLoading,
        errorComponent: AsyncComponentError,
        delay: 0,
      },
    ),
    SettingsModalAdminContent: getResettableAsyncComponent(
      () => import('./settings_modal_admin_content.vue'),
      {
        loadingComponent: PanelLoading,
        errorComponent: AsyncComponentError,
        delay: 0,
      },
    ),
  },
  methods: {
    closeModal() {
      useInterfaceStore().closeSettingsModal()
    },
    peekModal() {
      useInterfaceStore().togglePeekSettingsModal()
    },
    importValidator(data) {
      if (!Array.isArray(data._pleroma_settings_version)) {
        return {
          messageKey: 'settings.file_import_export.invalid_file',
        }
      }

      const [major, minor] = data._pleroma_settings_version

      if (major > PLEROMAFE_SETTINGS_MAJOR_VERSION) {
        return {
          messageKey: 'settings.file_export_import.errors.file_too_new',
          messageArgs: {
            fileMajor: major,
            feMajor: PLEROMAFE_SETTINGS_MAJOR_VERSION,
          },
        }
      }

      if (major < PLEROMAFE_SETTINGS_MAJOR_VERSION) {
        return {
          messageKey: 'settings.file_export_import.errors.file_too_old',
          messageArgs: {
            fileMajor: major,
            feMajor: PLEROMAFE_SETTINGS_MAJOR_VERSION,
          },
        }
      }

      if (minor > PLEROMAFE_SETTINGS_MINOR_VERSION) {
        useInterfaceStore().pushGlobalNotice({
          level: 'warning',
          messageKey: 'settings.file_export_import.errors.file_slightly_new',
        })
      }

      return true
    },
    onImportFailure(result) {
      if (result.error) {
        useInterfaceStore().pushGlobalNotice({
          messageKey: 'settings.invalid_settings_imported',
          level: 'error',
        })
      } else {
        useInterfaceStore().pushGlobalNotice({
          ...result.validationResult,
          level: 'error',
        })
      }
    },
    onImport(input) {
      if (!input) return
      const { _pleroma_settings_version, ...data } = input

      Object.entries(data).forEach(([path, value]) => {
        const definition = ROOT_CONFIG_DEFINITIONS[path]

        const finalValue = validateSetting({
          path,
          value,
          definition,
          throwError: false,
          defaultState: ROOT_CONFIG,
        })

        if (finalValue === undefined) return

        if (LOCAL_ONLY_KEYS.has(path)) {
          useLocalConfigStore().set({ path, value: finalValue })
        } else {
          if (path.startsWith('muteFilters')) {
            Object.keys(
              useMergedConfigStore().mergedConfig.muteFilters,
            ).forEach((key) => {
              useSyncConfigStore().unsetPreference({
                path: `simple.${path}.${key}`,
              })
            })

            Object.entries(value).forEach(([key, filter]) => {
              useSyncConfigStore().setPreference({
                path: `simple.${path}.${key}`,
                value: filter,
              })
            })
          } else {
            if (finalValue !== undefined) {
              useSyncConfigStore().setPreference({
                path: `simple.${path}`,
                value: finalValue,
              })
            }
          }
        }
      })
      useSyncConfigStore().pushSyncConfig()
    },
    restore() {
      this.dataImporter.importData()
    },
    backup() {
      this.dataExporter.exportData()
    },
    backupWithTheme() {
      this.dataThemeExporter.exportData()
    },
    generateExport(theme = false) {
      const config = useMergedConfigStore().mergedConfigWithoutDefaults
      let sample = config
      if (!theme) {
        const ignoreList = new Set([
          'theme',
          'customTheme',
          'customThemeSource',
          'colors',
          'style',
          'styleCustomData',
          'palette',
          'paletteCustomData',
          'themeChecksum',
        ])

        sample = Object.fromEntries(
          Object.entries(sample).filter(
            ([key, value]) => !ignoreList.has(key) && value !== undefined,
          ),
        )
      }
      const clone = cloneDeep(sample)
      clone._pleroma_settings_version = [
        PLEROMAFE_SETTINGS_MAJOR_VERSION,
        PLEROMAFE_SETTINGS_MINOR_VERSION,
      ]
      return clone
    },
    resetAdminDraft() {
      useAdminSettingsStore().resetAdminDraft()
    },
    pushAdminDraft() {
      useAdminSettingsStore().pushAdminDraft()
    },
    ...mapActions(useInterfaceStore, [
      'temporaryChangesRevert',
      'temporaryChangesConfirm',
    ]),
  },
  computed: {
    ...mapState(useInterfaceStore, {
      temporaryChangesCountdown: (store) => store.temporaryChangesCountdown,
      currentSaveStateNotice: (store) => store.settings.currentSaveStateNotice,
      modalActivated: (store) => store.settingsModalState !== 'hidden',
      modalMode: (store) => store.settingsModalMode,
      modalOpenedOnceUser: (store) => store.settingsModalLoadedUser,
      modalOpenedOnceAdmin: (store) => store.settingsModalLoadedAdmin,
      modalPeeked: (store) => store.settingsModalState === 'minimized',
    }),
    expertLevel: {
      get() {
        return useMergedConfigStore().mergedConfig.expertLevel > 0
      },
      set(value) {
        useSyncConfigStore().setSimplePrefAndSave({
          path: 'expertLevel',
          value: value ? 1 : 0,
        })
      },
    },
    adminDraftAny() {
      return !isEqual(
        useAdminSettingsStore().config,
        useAdminSettingsStore().draft,
      )
    },
  },
}

export default SettingsModal
