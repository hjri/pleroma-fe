import UserAvatar from 'src/components/user_avatar/user_avatar.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useUsersStore } from 'src/stores/users.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

const AvatarList = {
  props: {
    userIds: Set,
  },
  computed: {
    slicedUsers() {
      return [...(this.userIds ?? [])]
        .slice(0, 15)
        .map((id) => useUsersStore().findUser(id))
    },
  },
  components: {
    UserAvatar,
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

export default AvatarList
