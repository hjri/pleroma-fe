import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { updateNotificationSettings } from 'src/api/user.js'

const NotificationsTab = {
  data() {
    return {
      activeTab: 'profile',
      notificationSettings: useUsersStore().currentUser.notification_settings,
      newDomainToMute: '',
    }
  },
  components: {
    BooleanSetting,
  },
  computed: {
    user() {
      return useUsersStore().currentUser
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
