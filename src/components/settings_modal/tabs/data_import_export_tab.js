import { mapState } from 'vuex'

import Checkbox from 'src/components/checkbox/checkbox.vue'
import Exporter from 'src/components/exporter/exporter.vue'
import Importer from 'src/components/importer/importer.vue'

import { useCredentialsStore } from 'src/stores/credentials.js'
import { useOAuthTokensStore } from 'src/stores/oauth_tokens.js'

import {
  addBackup,
  exportFriends,
  fetchBlocks,
  fetchMutes,
  importBlocks,
  importFollows,
  importMutes,
  listBackups,
} from 'src/services/api/api.service.js'

const DataImportExportTab = {
  data() {
    return {
      activeTab: 'profile',
      newDomainToMute: '',
      listBackupsError: false,
      addBackupError: false,
      addedBackup: false,
      backups: [],
    }
  },
  created() {
    useOAuthTokensStore().fetchTokens()
    this.fetchBackups()
  },
  components: {
    Importer,
    Exporter,
    Checkbox,
  },
  computed: {
    ...mapState({
      user: (state) => state.users.currentUser,
    }),
  },
  methods: {
    getFollowsContent() {
      return exportFriends({
        id: this.user.id,
        credentials: useCredentialsStore().current,
      }).then(this.generateExportableUsersContent)
    },
    getBlocksContent() {
      return fetchBlocks({
        credentials: useCredentialsStore().current,
      }).then(this.generateExportableUsersContent)
    },
    getMutesContent() {
      return fetchMutes({
        credentials: useCredentialsStore().current,
      }).then(this.generateExportableUsersContent)
    },
    importFollows(file) {
      return importFollows({
        file,
        credentials: useCredentialsStore().current,
      }).then((status) => {
        if (!status) {
          throw new Error('failed')
        }
      })
    },
    importBlocks(file) {
      return importBlocks({
        file,
        credentials: useCredentialsStore().current,
      }).then((status) => {
        if (!status) {
          throw new Error('failed')
        }
      })
    },
    importMutes(file) {
      return importMutes({
        file,
        credentials: useCredentialsStore().current,
      }).then((status) => {
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
    addBackup() {
      addBackup({
        credentials: useCredentialsStore().current,
      })
        .then(() => {
          this.addedBackup = true
          this.addBackupError = false
        })
        .catch((error) => {
          this.addedBackup = false
          this.addBackupError = error
        })
        .then(() => this.fetchBackups())
    },
    fetchBackups() {
      listBackups({
        credentials: useCredentialsStore().current,
      })
        .then((res) => {
          this.backups = res
          this.listBackupsError = false
        })
        .catch((error) => {
          this.listBackupsError = error.error
        })
    },
  },
}

export default DataImportExportTab
