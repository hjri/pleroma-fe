import { get } from 'lodash'

import FollowCard from 'src/components/follow_card/follow_card.vue'
import List from 'src/components/list/list.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'
import Timeline from 'src/components/timeline/timeline.vue'
import UserCard from 'src/components/user_card/user_card.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useTimelinesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const defaultTabKey = 'statuses'

const UserProfile = {
  data() {
    return {
      error: false,
      userId: null,
      tab: defaultTabKey,
      footerRef: null,
    }
  },
  created() {
    const routeParams = this.$route.params
    this.load({ name: routeParams.name, id: routeParams.id })
    this.tab = get(this.$route, 'query.tab', defaultTabKey)
    useInterfaceStore().setForeignProfileBackground(this.user?.background_image)
  },
  updated() {
    useInterfaceStore().setForeignProfileBackground(this.user?.background_image)
  },
  unmounted() {
    this.stopFetching()
    useInterfaceStore().setForeignProfileBackground(null)
    this.$store.dispatch('clearFollowers', this.userId)
    this.$store.dispatch('clearFriends', this.userId)
  },
  computed: {
    favorites() {
      return useTimelinesStore().favorites
    },
    media() {
      return useTimelinesStore().media
    },
    isUs() {
      return (
        this.userId &&
        useUsersStore().currentUser.id &&
        this.userId === useUsersStore().currentUser.id
      )
    },
    user() {
      return useUsersStore().findUser(this.userId)
    },
    isExternal() {
      return this.$route.name === 'external-user-profile'
    },
    followsTabVisible() {
      return this.isUs || !this.user.hide_follows
    },
    followersTabVisible() {
      return this.isUs || !this.user.hide_followers
    },
    favoritesTabVisible() {
      return (
        this.isUs ||
        (useInstanceCapabilitiesStore().pleromaPublicFavouritesAvailable &&
          !this.user.hide_favorites)
      )
    },
    compactProfiles() {
      return useMergedConfigStore().mergedConfig.compactProfiles
    },
    friends() {
      return get(useUsersStore().findUser(this.userId), 'friendIds', []).map(
        (id) => useUsersStore().findUser(id),
      )
    },
    followers() {
      return get(useUsersStore().findUser(this.userId), 'followerIds', []).map(
        (id) => useUsersStore().findUser(id),
      )
    },
  },
  methods: {
    setFooterRef(el) {
      this.footerRef = el
    },
    fetchUsers(group) {
      return () =>
        useUsersStore()['fetch' + group](this.userId)
          .then((result) => ({ items: result }))
    },
    load(userNameOrId) {
      const loadById = (userId) => {
        this.userId = userId
      }

      // Reset view
      this.userId = null
      this.error = false

      const maybeId = userNameOrId.id
      const maybeName = userNameOrId.name

      // Check if user data is already loaded in store
      const user = maybeId
        ? useUsersStore().findUser(maybeId)
        : useUsersStore().findUserByName(maybeName)

      if (user) {
        loadById(user.id)
      } else {
        ;(maybeId
          ? this.$store.dispatch('fetchUser', maybeId)
          : this.$store.dispatch('fetchUserByName', maybeName)
        )
          .then(({ id }) => loadById(id))
          .catch((reason) => {
            const errorMessage = get(reason, 'error.error')
            if (errorMessage === 'No user with such user_id') {
              // Known error
              this.error = this.$t('user_profile.profile_does_not_exist')
            } else if (errorMessage) {
              this.error = errorMessage
            } else {
              this.error = this.$t('user_profile.profile_loading_error')
            }
          })
      }
    },
    switchUser(userNameOrId) {
      this.load(userNameOrId)
    },
    onTabSwitch(tab) {
      this.tab = tab
      this.$router.replace({ query: { tab } })
    },
    linkClicked({ target }) {
      if (target.tagName === 'SPAN') {
        target = target.parentNode
      }
      if (target.tagName === 'A') {
        window.open(target.href, '_blank')
      }
    },
  },
  watch: {
    '$route.params.id': function (newVal) {
      if (newVal) {
        this.switchUser({ id: newVal })
      }
    },
    '$route.params.name': function (newVal) {
      if (newVal) {
        this.switchUser({ name: newVal })
      }
    },
    '$route.query': function (newVal) {
      this.tab = newVal.tab || defaultTabKey
    },
  },
  components: {
    UserCard,
    Timeline,
    List,
    FollowCard,
    TabSwitcher,
  },
}

export default UserProfile
