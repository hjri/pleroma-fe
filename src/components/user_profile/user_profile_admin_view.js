import { get } from 'lodash'
import { mapState } from 'pinia'

import Conversation from 'src/components/conversation/conversation.vue'
import List from 'src/components/list/list.vue'
import UserCard from 'src/components/user_card/user_card.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useAdminSettingsStore } from 'src/stores/admin_settings.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const defaultTabKey = 'statuses'

const UserProfileAdminView = {
  data() {
    return {
      userId: null,
      godmode: false,
    }
  },
  created() {
    this.userId = this.$route.params.id
    console.log(this.userId)
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
        userId: this.userId,
        withReblogs: false
      }
    },
    user() {
      return this.$store.getters.findUser(this.userId)
    },
  },
  methods: {
    fetchStatuses(page) {
      return useAdminSettingsStore()
        .fetchStatuses({
          ...this.fetchOptions,
          page,
        })
        .then(({ count, users }) => ({ count, items: users }))
    },
  },
  components: {
    UserCard,
    List,
    Conversation,
  },
}

export default UserProfileAdminView
