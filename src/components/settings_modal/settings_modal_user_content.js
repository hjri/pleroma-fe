import VerticalTabSwitcher from './helpers/vertical_tab_switcher.jsx'

import DataImportExportTab from './tabs/data_import_export_tab.vue'
import MutesAndBlocksTab from './tabs/mutes_and_blocks_tab.vue'
import NotificationsTab from './tabs/notifications_tab.vue'
import FilteringTab from './tabs/filtering_tab.vue'
import SecurityTab from './tabs/security_tab/security_tab.vue'
import ProfileTab from './tabs/profile_tab.vue'
import GeneralTab from './tabs/general_tab.vue'
import PostsTab from './tabs/posts_tab.vue'
import ComposingTab from './tabs/composing_tab.vue'
import ClutterTab from './tabs/clutter_tab.vue'
import LayoutTab from './tabs/layout_tab.vue'
import AppearanceTab from './tabs/appearance_tab.vue'
import DeveloperTab from './tabs/developer_tab.vue'
import OldThemeTab from './tabs/old_theme_tab/old_theme_tab.vue'
import StyleTab from './tabs/style_tab/style_tab.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faWrench,
  faUser,
  faMessage,
  faFilter,
  faPaintBrush,
  faPalette,
  faBell,
  faDownload,
  faEyeSlash,
  faWindowRestore,
  faCode,
  faBroom,
  faLock,
  faColumns,
} from '@fortawesome/free-solid-svg-icons'
import { useInterfaceStore } from 'src/stores/interface'

library.add(
  faWrench,
  faUser,
  faMessage,
  faWindowRestore,
  faColumns,
  faBell,
  faFilter,
  faEyeSlash,
  faBroom,
  faLock,
  faDownload,
  faPalette,
  faPaintBrush,
  faCode,
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
    PostsTab,
    ComposingTab,
    ClutterTab,
    LayoutTab,
    AppearanceTab,
    StyleTab,
    DeveloperTab,
    OldThemeTab,
  },
  computed: {
    isLoggedIn() {
      return !!this.$store.state.users.currentUser
    },
    open() {
      return useInterfaceStore().settingsModalState !== 'hidden'
    },
    bodyLock() {
      return useInterfaceStore().settingsModalState === 'visible'
    },
    expertLevel() {
      return this.$store.state.config.expertLevel
    },
  },
  data() {
    return {
      navCollapsed: false,
      navHideHeader: false,
    }
  },
  methods: {
    onOpen() {
      const targetTab = useInterfaceStore().settingsModalTargetTab
      // We're being told to open in specific tab
      if (targetTab) {
        const tabIndex = this.$refs.tabSwitcher.$slots
          .default()
          .findIndex((elm) => {
            return elm.props && elm.props['data-tab-name'] === targetTab
          })
        if (tabIndex >= 0) {
          this.$refs.tabSwitcher.setTab(tabIndex)
        }
      }
      // Clear the state of target tab, so that next time settings is opened
      // it doesn't force it.
      useInterfaceStore().clearSettingsModalTargetTab()
    },
  },
  mounted() {
    this.onOpen()
  },
  watch: {
    open: function (value) {
      if (value) this.onOpen()
    },
  },
}

export default SettingsModalContent
