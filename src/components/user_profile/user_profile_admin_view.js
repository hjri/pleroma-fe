import { get } from 'lodash'
import { mapState } from 'pinia'

import List from 'src/components/list/list.vue'
import Status from 'src/components/status/status.vue'
import UserCard from 'src/components/user_card/user_card.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useInterfaceStore } from 'src/stores/interface.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const UserProfileAdminView = {
  data() {
    return {
      userId: null,
      godmode: false,
    }
  },
  created() {
    this.userId = this.$route.params.id
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
        withReblogs: false,
      }
    },
    user() {
      return this.$store.getters.findUser(this.userId)
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
  },
}

export default UserProfileAdminView
