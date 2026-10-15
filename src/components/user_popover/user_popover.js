import { mapState } from 'pinia'

import Popover from 'src/components/popover/popover.vue'
import UserCard from 'src/components/user_card/user_card.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

const UserPopover = {
  name: 'UserPopover',
  props: {
    userId: String,
    userObject: Object,
    overlayCenters: Boolean,
    disabled: Boolean,
    overlayCentersSelector: String,
  },
  components: {
    UserCard,
    Popover,
  },
  computed: {
    user() {
      return this.userObject ?? useUsersStore().findUser(this.userId)
    },
    ...mapState(useMergedConfigStore, {
      userPopoverAvatarAction: (state) =>
        state.mergedConfig.userPopoverAvatarAction,
      userPopoverOverlay: (state) => state.mergedConfig.userPopoverOverlay,
    }),
  },
}

export default UserPopover
