import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import UserCard from '../user_card/user_card.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

const UserPopover = {
  name: 'UserPopover',
  props: ['userId', 'overlayCenters', 'disabled', 'overlayCentersSelector'],
  components: {
    UserCard,
    Popover: defineAsyncComponent(() => import('../popover/popover.vue')),
  },
  computed: mapState(useMergedConfigStore, {
    userPopoverAvatarAction: (state) =>
      state.mergedConfig.userPopoverAvatarAction,
    userPopoverOverlay: (state) => state.mergedConfig.userPopoverOverlay,
  }),
}

export default UserPopover
