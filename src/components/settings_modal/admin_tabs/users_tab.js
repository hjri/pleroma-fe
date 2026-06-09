import { isEmpty } from 'lodash'

import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import GenericConfirm from 'src/components/confirm_modal/generic_confirm.vue'
import List from 'src/components/list/list.vue'
import ModerationTools from 'src/components/moderation_tools/moderation_tools.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import Select from 'src/components/select/select.vue'
import AdminCard from 'src/components/settings_modal/admin_tabs/admin_card.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'

const UsersTab = {
  components: {
    Checkbox,
    Select,
    BasicUserCard,
    List,
    ProgressButton,
    AdminCard,
    TabSwitcher,
    ModerationTools,
    GenericConfirm,
  },
  provide() {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin',
    }
  },
  data() {
    return {
      filtersOrigin: 'local',
      filtersActivity: 'all',
      filtersPrivileges: 'all',
      filtersNeedApproval: false,
      filtersUnconfirmed: false,
      filtersQuery: '',
      filtersName: '',
      filtersEmail: '',
      expandedUser: null,
    }
  },
  computed: {
    /**
     * do we filter for admins?
     * @returns {boolean}
     */
    filtersIsAdmin() {
      return (
        this.filtersPrivileges === 'admin' ||
        this.filtersPrivileges === 'modsnadmins'
      )
    },
    /**
     * do we filter for moderators?
     * @returns {boolean}
     */
    filtersIsModerator() {
      return (
        this.filtersPrivileges === 'moderator' ||
        this.filtersPrivileges === 'modsnadmins'
      )
    },
    /**
     * do we filter for active users?
     * @returns {boolean}
     */
    filtersActive() {
      return this.filtersActivity === 'active'
    },
    /**
     * do we filter for deactivated users?
     * @returns {boolean}
     */
    filtersDeactivated() {
      return this.filtersActivity === 'deactivated'
    },
    /**
     * do we filter for local users?
     * @returns {boolean}
     */
    filtersLocal() {
      return this.filtersOrigin === 'local'
    },
    /**
     * do we filter for external users?
     * @return {boolean}
     */
    filtersExternal() {
      return this.filtersOrigin === 'external'
    },
    fetchOptions() {
      const filters = {
        isAdmin: this.filtersIsAdmin,
        isModerator: this.filtersIsModerator,
        active: this.filtersActive,
        deactivated: this.filtersDeactivated,
        local: this.filtersLocal,
        external: this.filtersExternal,
        needApproval: this.filtersNeedApproval,
        unconfirmed: this.filtersUnconfirmed,
      }

      return {
        query: this.filtersQuery,
        name: this.filtersName,
        email: this.filtersEmail,
        pageSize: 50,
        filters,
      }
    },
  },
  methods: {
    fetchUsers(page) {
      return useAdminSettingsStore()
        .fetchAdminUsers({
          ...this.fetchOptions,
          page,
        })
        .then(({ count, users }) => ({ count, items: users }))
    },
  },
  watch: {
    fetchOptions() {
      this.$refs.usersList.reset()
    },
  },
}

export default UsersTab
