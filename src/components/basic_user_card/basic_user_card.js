import RichContent from 'src/components/rich_content/rich_content.jsx'
import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'
import { useInstanceStore } from 'src/stores/instance.js'
import UserAvatar from '../user_avatar/user_avatar.vue'
import UserLink from '../user_link/user_link.vue'
import UserPopover from '../user_popover/user_popover.vue'

const BasicUserCard = {
  props: ['user'],
  components: {
    UserPopover,
    UserAvatar,
    RichContent,
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
}

export default BasicUserCard
