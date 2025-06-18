import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

const NotificationsTab = {
  data () {
    return {
      activeTab: 'profile',
      notificationSettings: this.$store.state.users.currentUser.notification_settings,
      newDomainToMute: ''
    }
  },
  components: {
    BooleanSetting
  },
  computed: {
    user () {
      return this.$store.state.users.currentUser
    },
    canReceiveReports () {
      if (!this.user) { return false }
      return this.user.privileges.includes('reports_manage_reports')
    },
    ...SharedComputedObject()
  },
  methods: {
    updateNotificationSettings () {
      this.$store.state.api.backendInteractor
        .updateNotificationSettings({ settings: this.notificationSettings })
    }
  }
}

export default NotificationsTab
