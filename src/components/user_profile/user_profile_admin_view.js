import Checkbox from 'src/components/checkbox/checkbox.vue'
import List from 'src/components/list/list.vue'
import Status from 'src/components/status/status.vue'
import UserCard from 'src/components/user_card/user_card.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const UserProfileAdminView = {
  data() {
    return {
      godmode: false,
      showReblogs: false,
    }
  },
  created() {
    this.$store.dispatch('fetchUserIfMissing', this.userId)
    useInterfaceStore().setForeignProfileBackground(this.user?.background_image)
  },
  updated() {
    useInterfaceStore().setForeignProfileBackground(this.user?.background_image)
  },
  unmounted() {
    useInterfaceStore().setForeignProfileBackground(null)
  },
  computed: {
    fetchOptions() {
      return {
        pageSize: 20,
        godmode: this.godmode,
        id: this.userId,
        withReblogs: this.showReblogs,
      }
    },
    user() {
      return useUsersStore().findUser(this.userId)
    },
    userId() {
      return this.$route.params.id
    },
  },
  methods: {
    fetchStatuses(page) {
      return useAdminSettingsStore().fetchStatuses({
        ...this.fetchOptions,
        page,
      })
    },
  },
  components: {
    UserCard,
    List,
    Status,
    Checkbox,
  },
  watch: {
    fetchOptions() {
      this.$refs.list.reset()
    },
  },
}

export default UserProfileAdminView
