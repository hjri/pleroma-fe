import StillImage from '../still-image/still-image.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPeopleGroup, faRobot } from '@fortawesome/free-solid-svg-icons'

library.add(faRobot, faPeopleGroup)

const UserAvatar = {
  props: {
    // User object to show avatar of
    user: {
      required: true,
      type: Object,
    },
    // Use less space and use alternative roundness
    compact: {
      required: false,
      type: Boolean,
      default: false,
    },
    // Show small icon indicating if account is a bot or group
    showActorTypeIndicator: {
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
      defaultAvatar: `${useInstanceStore().server + useInstanceStore().defaultAvatar}`,
      betterShadow: useInterfaceStore().browserSupport.cssFilter,
    }
  },
  components: {
    StillImage,
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
