import VerticalTabSwitcher from 'src/components/tab_switcher/vertical_tab_switcher.jsx'

import DataImportExportTab from './tabs/data_import_export_tab.vue'
import MutesAndBlocksTab from './tabs/mutes_and_blocks_tab.vue'
import NotificationsTab from './tabs/notifications_tab.vue'
import FilteringTab from './tabs/filtering_tab.vue'
import SecurityTab from './tabs/security_tab/security_tab.vue'
import ProfileTab from './tabs/profile_tab.vue'
import GeneralTab from './tabs/general_tab.vue'
import AppearanceTab from './tabs/appearance_tab.vue'
import VersionTab from './tabs/version_tab.vue'
import ThemeTab from './tabs/theme_tab/theme_tab.vue'
import StyleTab from './tabs/style_tab/style_tab.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faWrench,
  faUser,
  faFilter,
  faPaintBrush,
  faPalette,
  faBell,
  faDownload,
  faEyeSlash,
  faInfo,
  faWindowRestore
} from '@fortawesome/free-solid-svg-icons'
import { useInterfaceStore } from 'src/stores/interface'

library.add(
  faWrench,
  faUser,
  faFilter,
  faPaintBrush,
  faPalette,
  faBell,
  faDownload,
  faEyeSlash,
  faInfo,
  faWindowRestore
)

const SettingsModalContent = {
  components: {
    VerticalTabSwitcher,

    DataImportExportTab,
    MutesAndBlocksTab,
    NotificationsTab,
    FilteringTab,
    SecurityTab,
    ProfileTab,
    GeneralTab,
    AppearanceTab,
    StyleTab,
    VersionTab,
    ThemeTab
  },
  computed: {
    isLoggedIn () {
      return !!this.$store.state.users.currentUser
    },
    open () {
      return useInterfaceStore().settingsModalState !== 'hidden'
    },
    bodyLock () {
      return useInterfaceStore().settingsModalState === 'visible'
    },
    expertLevel () {
      return this.$store.state.config.expertLevel
    },
    isMobileLayout () {
      return useInterfaceStore().layoutType === 'mobile'
    }
  },
  methods: {
    onOpen () {
      const targetTab = useInterfaceStore().settingsModalTargetTab
      // We're being told to open in specific tab
      if (targetTab) {
        const tabIndex = this.$refs.tabSwitcher.$slots.default().findIndex(elm => {
          return elm.props && elm.props['data-tab-name'] === targetTab
        })
        if (tabIndex >= 0) {
          this.$refs.tabSwitcher.setTab(tabIndex)
        }
      }
      // Clear the state of target tab, so that next time settings is opened
      // it doesn't force it.
      useInterfaceStore().clearSettingsModalTargetTab()
    }
  },
  mounted () {
    this.onOpen()
  },
  watch: {
    open: function (value) {
      if (value) this.onOpen()
    }
  }
}

export default SettingsModalContent
