import { defineAsyncComponent } from 'vue'

import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

export default {
  name: 'ChatTitle',
  components: {
    UserAvatar,

    UserPopover,
  },
  props: ['user', 'withAvatar'],
  computed: {
    title() {
      return this.user ? this.user.screen_name_ui : ''
    },
    htmlTitle() {
      return this.user ? this.user.name_html : ''
    },
    allowNonSquareEmoji() {
      return useMergedConfigStore().mergedConfig.nonSquareEmoji
    },
  },
}
