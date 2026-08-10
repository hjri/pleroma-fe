import { shuffle } from 'lodash'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchUser, suggestions } from 'src/api/public.js'
import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

function showWhoToFollow(panel, reply) {
  const shuffled = shuffle(reply)

  panel.usersToFollow.forEach((toFollow, index) => {
    const user = shuffled[index]
    const img = user.avatar || useInstanceStore().instanceIdentity.defaultAvatar
    const name = user.acct

    toFollow.img = img
    toFollow.name = name

    fetchUser({
      id: name,
      credentials: useOAuthStore().token,
    }).then(({ data: externalUser }) => {
      if (!externalUser.error) {
        panel.$store.commit('addNewUsers', [externalUser])
        toFollow.id = externalUser.id
      }
    })
  })
}

function getWhoToFollow(panel) {
  const credentials = panel.$useUsersStore().currentUser.credentials
  if (credentials) {
    panel.usersToFollow.forEach((toFollow) => {
      toFollow.name = 'Loading...'
    })
    suggestions({ credentials }).then(({ data: reply }) => {
      showWhoToFollow(panel, reply)
    })
  }
}

const WhoToFollowPanel = {
  data: () => ({
    usersToFollow: [],
  }),
  computed: {
    user: function () {
      return useUsersStore().currentUser.screen_name
    },
    suggestionsEnabled() {
      return useInstanceCapabilitiesStore().suggestionsEnabled
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
  },
  watch: {
    user: function () {
      if (this.suggestionsEnabled) {
        getWhoToFollow(this)
      }
    },
  },
  mounted: function () {
    this.usersToFollow = new Array(3).fill().map(() => ({
      img: useInstanceStore().instanceIdentity.defaultAvatar,
      name: '',
      id: 0,
    }))
    if (this.suggestionsEnabled) {
      getWhoToFollow(this)
    }
  },
}

export default WhoToFollowPanel
