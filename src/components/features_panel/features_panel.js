import { mapState } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'
import fileSizeFormatService from '../../services/file_size_format/file_size_format.js'

const FeaturesPanel = {
  computed: {
    ...mapState(useInstanceStore, {
      shout: (store) => store.shoutAvailable,
      pleromaChatMessages: (store) =>
        store.featureSet.pleromaChatMessagesAvailable,
      gopher: (store) => store.featureSet.gopherAvailable,
      whoToFollow: (store) => store.featureSet.suggestionsEnabled,
      mediaProxy: (store) => store.featureSet.mediaProxyAvailable,
      minimalScopesMode: (store) => store.prefsStorage.minimalScopesMode,
      textlimit: (store) => store.limits.textlimit,
      uploadlimit: (store) =>
        fileSizeFormatService.fileSizeFormat(store.limits.uploadlimit),
    }),
  },
}

export default FeaturesPanel
