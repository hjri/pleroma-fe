import { get, map, reject, isEmpty } from 'lodash'

import Autosuggest from 'src/components/autosuggest/autosuggest.vue'
import BlockCard from 'src/components/block_card/block_card.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import DomainMuteCard from 'src/components/domain_mute_card/domain_mute_card.vue'
import List from 'src/components/list/list.vue'
import MuteCard from 'src/components/mute_card/mute_card.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import SelectableList from 'src/components/selectable_list/selectable_list.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'

import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthTokensStore } from 'src/stores/oauth_tokens.js'

const MutesAndBlocks = {
  data() {
    return {
      activeTab: 'profile',
      mutesLoading: false,
      mutesError: null,
      mutesBottomedOut: false,
      blocksLoading: false,
      blocksError: null,
      blocksBottomedOut: false,
      domainsLoading: false,
      domainsError: null,
      domainsBottomedOut: false,
    }
  },
  created() {
    useOAuthTokensStore().fetchTokens()
    useInstanceStore().getKnownDomains()
  },
  components: {
    TabSwitcher,
    DomainMuteCard,
    BlockCard,
    List,
    MuteCard,
    ProgressButton,
    Autosuggest,
    Checkbox,
  },
  computed: {
    knownDomains() {
      return useInstanceStore().knownDomains
    },
    user() {
      return this.$store.state.users.currentUser
    },
    blocks() {
      return get(this.$store.state.users.currentUser, 'blockIds', [])
    },
    mutes() {
      return get(this.$store.state.users.currentUser, 'muteIds', [])
    },
    domains() {
      return get(this.$store.state.users.currentUser, 'domainMutes', [])
    },
  },
  methods: {
    fetchItems(group) {
      if (this[group + 'Loading']) return

      const capGroup = group[0].toUpperCase() + group.slice(1)

      this[group + 'Loading'] = true
      this[group + 'Error'] = null

      this.$store
        .dispatch('fetch' + capGroup, this.userId)
        .then((newEntries) => {
          this[group + 'Loading'] = false
          this[group + 'BottomedOut'] = isEmpty(newEntries)
          return newEntries
        })
        .catch((error) => {
          this[group + 'Loading'] = false
          this[group + 'Error'] = error
        })
    },
    importFollows(file) {
      return this.$store.state.api.backendInteractor
        .importFollows({ file })
        .then((status) => {
          if (!status) {
            throw new Error('failed')
          }
        })
    },
    importBlocks(file) {
      return this.$store.state.api.backendInteractor
        .importBlocks({ file })
        .then((status) => {
          if (!status) {
            throw new Error('failed')
          }
        })
    },
    generateExportableUsersContent(users) {
      // Get addresses
      return users
        .map((user) => {
          // check is it's a local user
          if (user && user.is_local) {
            // append the instance address
            return user.screen_name + '@' + location.hostname
          }
          return user.screen_name
        })
        .join('\n')
    },
    activateTab(tabName) {
      this.activeTab = tabName
    },
    filterUnblockedUsers(userIds) {
      return reject(userIds, (userId) => {
        const relationship = this.$store.getters.relationship(this.userId)
        return relationship.blocking || userId === this.user.id
      })
    },
    filterUnMutedUsers(userIds) {
      return reject(userIds, (userId) => {
        const relationship = this.$store.getters.relationship(this.userId)
        return relationship.muting || userId === this.user.id
      })
    },
    queryUserIds(query) {
      return this.$store
        .dispatch('searchUsers', { query })
        .then((users) => map(users, 'id'))
    },
    blockUsers(ids) {
      return this.$store.dispatch('blockUsers', ids)
    },
    unblockUsers(ids) {
      return this.$store.dispatch('unblockUsers', ids)
    },
    muteUsers(ids) {
      return this.$store.dispatch('muteUsers', ids)
    },
    unmuteUsers(ids) {
      return this.$store.dispatch('unmuteUsers', ids)
    },
    filterUnMutedDomains(urls) {
      return urls.filter((url) => !this.user.domainMutes.includes(url))
    },
    queryKnownDomains(query) {
      return new Promise((resolve) => {
        resolve(
          this.knownDomains.filter((url) => url.toLowerCase().includes(query)),
        )
      })
    },
    unmuteDomains(domains) {
      return this.$store.dispatch('unmuteDomains', domains)
    },
  },
}

export default MutesAndBlocks
