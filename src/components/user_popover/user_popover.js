import { mapState } from 'pinia'

import Popover from 'src/components/popover/popover.vue'
import UserCard from 'src/components/user_card/user_card.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

const UserPopover = {
  name: 'UserPopover',
  props: {
    userId: String,
    userObject: Object,
    overlayCenters: Boolean,
    disabled: Boolean,
    link: Boolean,
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
    to() {
      return generateProfileLink(
        this.user.id,
        this.user.screen_name,
        useInstanceStore().restrictedNicknames,
      )
    },
    ...mapState(useMergedConfigStore, {
      userPopoverAvatarAction: (state) =>
        state.mergedConfig.userPopoverAvatarAction,
      userPopoverOverlay: (state) => state.mergedConfig.userPopoverOverlay,
    }),
  },
}

export default UserPopover
