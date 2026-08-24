import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPeopleGroup, faRobot } from '@fortawesome/free-solid-svg-icons'

library.add(faRobot, faPeopleGroup)

const UserAvatar = {
  props: {
    // UserID of a user to show avatar of
    userId: {
      required: false, // You can pass null to just render a placeholder
      type: String,
    },
    // Use less space and use alternative roundness
    compact: {
      required: false,
      type: Boolean,
      default: false,
    },
    // Override avatar image URL, useful for profile editing
    url: {
      required: false,
      type: String,
      default: null,
    },
  },
  data() {
    return {
      showPlaceholder: false,
      defaultAvatar: `${useInstanceStore().server + useInstanceStore().instanceIdentity.defaultAvatar}`,
      betterShadow: useInterfaceStore().browserSupport.cssFilter,
    }
  },
  computed: {
    user() {
      return useUsersStore().findUser(this.userId)
    },
    showActorTypeIndicator() {
      return useMergedConfigStore().mergedConfig.hideBotIndication
    },
  },
  methods: {
    imgSrc(src) {
      return !src || this.showPlaceholder ? this.defaultAvatar : src
    },
    imageLoadError() {
      this.showPlaceholder = true
    },
  },
}

export default UserAvatar
