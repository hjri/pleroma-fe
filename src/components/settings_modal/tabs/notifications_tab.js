import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

import { useOAuthStore } from 'src/stores/oauth.js'

import { updateNotificationSettings } from 'src/services/api/api.service.js'

const NotificationsTab = {
  data() {
    return {
      activeTab: 'profile',
      notificationSettings:
        this.$store.state.users.currentUser.notification_settings,
      newDomainToMute: '',
    }
  },
  components: {
    BooleanSetting,
  },
  computed: {
    user() {
      return this.$store.state.users.currentUser
    },
    canReceiveReports() {
      if (!this.user) {
        return false
      }
      return this.user.privileges.has('reports_manage_reports')
    },
    ...SharedComputedObject(),
  },
  methods: {
    updateNotificationSettings() {
      updateNotificationSettings({
        credentials: useOAuthStore().token,
        settings: this.notificationSettings,
      })
    },
  },
}

export default NotificationsTab
