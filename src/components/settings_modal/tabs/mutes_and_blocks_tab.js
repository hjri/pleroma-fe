import { get, map, reject } from 'lodash-es'

import Autosuggest from 'src/components/autosuggest/autosuggest.vue'
import BlockCard from 'src/components/block_card/block_card.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import DomainMuteCard from 'src/components/domain_mute_card/domain_mute_card.vue'
import List from 'src/components/list/list.vue'
import MuteCard from 'src/components/mute_card/mute_card.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'

import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useOAuthTokensStore } from 'src/stores/oauth_tokens.js'
import { useSearchStore } from 'src/stores/search.js'
import { useUsersStore } from 'src/stores/users.js'

import { importBlocks, importFollows } from 'src/api/user.js'

const MutesAndBlocks = {
  data() {
    return {
      activeTab: 'profile',
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
      return useUsersStore().currentUser
    },
    blocks() {
      return get(this.user, 'blockIds', [])
    },
    mutes() {
      return get(this.user, 'muteIds', [])
    },
    domains() {
      return get(this.user, 'domainMutes', [])
    },
  },
  methods: {
    fetchItems(group) {
      return () => useUsersStore()['fetch' + group](this.userId)
    },
    importFollows(file) {
      return importFollows({
        file,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) => {
        if (!status) {
          throw new Error('failed')
        }
      })
    },
    importBlocks(file) {
      return importBlocks({
        file,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) => {
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
          if (user?.is_local) {
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
        const relationship = useUsersStore().relationship(this.userId)
        return relationship.blocking || userId === this.user.id
      })
    },
    filterUnMutedUsers(userIds) {
      return reject(userIds, (userId) => {
        const relationship = useUsersStore().relationship(this.userId)
        return relationship.muting || userId === this.user.id
      })
    },
    queryUserIds(query) {
      return useSearchStore()
        .searchUsers({ query })
        .then((users) => map(users, 'id'))
    },
    blockUsers(ids) {
      return useUsersStore().blockUsers(ids)
    },
    unblockUsers(ids) {
      return useUsersStore().unblockUsers(ids)
    },
    muteUsers(ids) {
      return useUsersStore().muteUsers(ids)
    },
    unmuteUsers(ids) {
      return useUsersStore().unmuteUsers(ids)
    },
    filterUnMutedDomains(urls) {
      return urls.filter((url) => !this.user.domainMutes.has(url))
    },
    queryKnownDomains(query) {
      return new Promise((resolve) => {
        resolve(
          this.knownDomains.filter((url) => url.toLowerCase().includes(query)),
        )
      })
    },
    unmuteDomains(domains) {
      return useUsersStore().unmuteDomains(domains)
    },
  },
}

export default MutesAndBlocks
