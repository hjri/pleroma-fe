import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

const SharedComputedObject = () => ({
  ...mapPiniaState(useMergedConfigStore, ['mergedConfig']),
  ...mapPiniaState(useMergedConfigStore, {
    expertLevel: (store) => store.mergedConfig.expertLevel,
  }),
  ...mapState({
    adminConfig: (state) => state.adminSettings.config,
    adminDraft: (state) => state.adminSettings.draft,
    user: (state) => state.users.currentUser,
  }),
})

export default SharedComputedObject
