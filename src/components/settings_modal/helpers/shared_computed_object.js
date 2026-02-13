import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import { useSyncConfigStore } from 'src/stores/sync_config.js'

const SharedComputedObject = () => ({
  ...mapPiniaState(useSyncConfigStore, ['mergedConfig']),
  ...mapPiniaState(useSyncConfigStore, {
    expertLevel: (store) => store.mergedConfig.expertLevel,
  }),
  ...mapState({
    adminConfig: (state) => state.adminSettings.config,
    adminDraft: (state) => state.adminSettings.draft,
    user: (state) => state.users.currentUser,
  }),
})

export default SharedComputedObject
