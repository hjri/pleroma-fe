import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faChain,
  faChartLine,
  faCircleNodes,
  faDoorOpen,
  faEllipsis,
  faEnvelope,
  faGauge,
  faGears,
  faGlobe,
  faHand,
  faKey,
  faLaptopCode,
  faMessage,
  faTowerBroadcast,
  faUpload,
  faWrench,
} from '@fortawesome/free-solid-svg-icons'
import { useInterfaceStore } from 'src/stores/interface'
import AuthTab from './admin_tabs/auth_tab.vue'
import EmojiTab from './admin_tabs/emoji_tab.vue'
import FederationTab from './admin_tabs/federation_tab.vue'
import FrontendsTab from './admin_tabs/frontends_tab.vue'
import HTTPTab from './admin_tabs/http_tab.vue'
import InstanceTab from './admin_tabs/instance_tab.vue'
import JobQueuesTab from './admin_tabs/job_queues_tab.vue'
import LimitsTab from './admin_tabs/limits_tab.vue'
import LinksTab from './admin_tabs/links_tab.vue'
import MailerTab from './admin_tabs/mailer_tab.vue'
import MediaProxyTab from './admin_tabs/media_proxy_tab.vue'
import MonitoringTab from './admin_tabs/monitoring_tab.vue'
import OtherTab from './admin_tabs/other_tab.vue'
import PostsTab from './admin_tabs/posts_tab.vue'
import RatesTab from './admin_tabs/rates_tab.vue'
import RegistrationsTab from './admin_tabs/registrations_tab.vue'
import UploadsTab from './admin_tabs/uploads_tab.vue'
import VerticalTabSwitcher from './helpers/vertical_tab_switcher.jsx'

library.add(
  faWrench,
  faHand,
  faChain,
  faGlobe,
  faLaptopCode,
  faTowerBroadcast,
  faEnvelope,
  faChartLine,
  faDoorOpen,
  faGears,
  faKey,
  faCircleNodes,
  faUpload,
  faMessage,
  faEllipsis,
  faGauge,
)

const SettingsModalAdminContent = {
  components: {
    VerticalTabSwitcher,

    InstanceTab,
    RegistrationsTab,
    EmojiTab,
    FrontendsTab,
    FederationTab,
    LimitsTab,
    MailerTab,
    UploadsTab,
    MediaProxyTab,
    LinksTab,
    JobQueuesTab,
    AuthTab,
    HTTPTab,
    MonitoringTab,
    RatesTab,
    OtherTab,
    PostsTab,
  },
  computed: {
    user() {
      return this.$store.state.users.currentUser
    },
    isLoggedIn() {
      return !!this.$store.state.users.currentUser
    },
    open() {
      return useInterfaceStore().settingsModalState !== 'hidden'
    },
    bodyLock() {
      return useInterfaceStore().settingsModalState === 'visible'
    },
    adminDbLoaded() {
      return this.$store.state.adminSettings.loaded
    },
    adminDescriptionsLoaded() {
      return this.$store.state.adminSettings.descriptions !== null
    },
    noDb() {
      return this.$store.state.adminSettings.dbConfigEnabled === false
    },
  },
  created() {
    if (this.user.rights.admin) {
      this.$store.dispatch('loadAdminStuff')
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

export default SettingsModalAdminContent
