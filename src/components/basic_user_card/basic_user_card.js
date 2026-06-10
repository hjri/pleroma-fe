import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserLink from 'src/components/user_link/user_link.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

const BasicUserCard = {
  props: {
    user: {
      type: Object,
    },
    showLineLabels: {
      type: Boolean,
      default: false,
    }
  },
  components: {
    UserPopover,
    UserAvatar,

    UserLink,
  },
  methods: {
    userProfileLink(user) {
      return generateProfileLink(
        user.id,
        user.screen_name,
        useInstanceStore().restrictedNicknames,
      )
    },
  },
  computed: {
    allowNonSquareEmoji() {
      return useMergedConfigStore().mergedConfig.nonSquareEmoji
    },
  },
}

export default BasicUserCard
