import { shuffle } from 'lodash-es'

import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchUser, suggestions } from 'src/api/public.js'
import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

const WhoToFollowPanel = {
  data: () => ({
    usersToFollow: [],
  }),
  computed: {
    user() {
      return useUsersStore().currentUser.screen_name
    },
  },
  methods: {
    userProfileLink(id, name) {
      return generateProfileLink(
        id,
        name,
        useInstanceStore().restrictedNicknames,
      )
    },
    getWhoToFollow() {
      this.usersToFollow.forEach((toFollow) => {
        toFollow.name = 'Loading...'
      })

      suggestions({ credentials: useOAuthStore().token }).then(
        ({ data: reply }) => {
          this.showWhoToFollow(reply)
        },
      )
    },
    showWhoToFollow(reply) {
      const shuffled = shuffle(reply)

      this.usersToFollow.forEach((toFollow, index) => {
        const user = shuffled[index]
        const img =
          user.avatar || useInstanceStore().instanceIdentity.defaultAvatar
        const name = user.acct

        toFollow.img = img
        toFollow.name = name

        fetchUser({
          id: name,
          credentials: useOAuthStore().token,
        }).then((result) => {
          const { data: externalUser } = result
          useUsersStore().addNewUsers(result)
          toFollow.id = externalUser.id
        })
      })
    },
  },
  watch: {
    user() {
      this.getWhoToFollow()
    },
  },
  mounted() {
    this.usersToFollow = new Array(3).fill().map(() => ({
      img: useInstanceStore().instanceIdentity.defaultAvatar,
      name: '',
      id: 0,
    }))

    this.getWhoToFollow()
  },
}

export default WhoToFollowPanel
