import Popover from 'src/components/popover/popover.vue'
import UnicodeDomainIndicator from 'src/components/unicode_domain_indicator/unicode_domain_indicator.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const UserListPopover = {
  name: 'UserListPopover',
  props: {
    userIds: Set
  },
  components: {
    UnicodeDomainIndicator,
    Popover,
    UserAvatar,
  },
  computed: {
    usersCapped() {
      return [...this.userIds].slice(0, 16).map((id) => useUsersStore().findUser(id))
    },
    allowNonSquareEmoji() {
      return useMergedConfigStore().mergedConfig.nonSquareEmoji
    },
    pauseMfm() {
      return useMergedConfigStore().mergedConfig.pauseMfm
    },
    scaleMfm() {
      return useMergedConfigStore().mergedConfig.scaleMfm
    },
  },
  methods: {
    generateProfileLink(user) {
      return generateProfileLink(
        user.id,
        user.screen_name,
        useInstanceStore().restrictedNicknames,
      )
    },
  },
}

export default UserListPopover
