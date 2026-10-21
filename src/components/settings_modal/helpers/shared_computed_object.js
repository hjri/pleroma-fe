import { mapState } from 'pinia'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

const SharedComputedObject = () => ({
  ...mapState(useMergedConfigStore, ['mergedConfig']),
  ...mapState(useMergedConfigStore, {
    expertLevel: (store) => store.mergedConfig.expertLevel,
  }),
  ...mapState(useAdminSettingsStore, {
    adminConfig: (store) => store.config,
    adminDraft: (store) => store.draft,
  }),
  ...mapState(useUsersStore, {
    user: (store) => store.currentUser,
  }),
})

export default SharedComputedObject
