import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

const SharedComputedObject = () => ({
  ...mapPiniaState(useMergedConfigStore, ['mergedConfig']),
  ...mapPiniaState(useMergedConfigStore, {
    expertLevel: (store) => store.mergedConfig.expertLevel,
  }),
  ...mapPiniaState(useAdminSettingsStore, {
    adminConfig: (store) => store.config,
    adminDraft: (store) => store.draft,
  }),
  ...mapState({
    user: (state) => state.users.currentUser,
  }),
})

export default SharedComputedObject
