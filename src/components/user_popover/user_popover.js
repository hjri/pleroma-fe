import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import Popover from 'src/components/popover/popover.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

const UserPopover = {
  name: 'UserPopover',
  props: ['userId', 'overlayCenters', 'disabled', 'overlayCentersSelector'],
  components: {
    UserCard: defineAsyncComponent(
      () => import('src/components/user_card/user_card.vue'),
    ),
    Popover,
  },
  computed: mapState(useMergedConfigStore, {
    userPopoverAvatarAction: (state) =>
      state.mergedConfig.userPopoverAvatarAction,
    userPopoverOverlay: (state) => state.mergedConfig.userPopoverOverlay,
  }),
}

export default UserPopover
