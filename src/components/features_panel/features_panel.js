import { mapState } from 'pinia'

import fileSizeFormatService from '../../services/file_size_format/file_size_format.js'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance.js'

const FeaturesPanel = {
  computed: {
    ...mapState(useInstanceCapabilitiesStore, [
      'suggestionsEnabled',
      'pleromaChatMessagesAvailable',
      'mediaProxyAvailable',
      'gopherAvailable',
      'shoutAvailable',
    ],
    )
    ...mapState(useInstanceStore, {
      textlimit: (store) => store.limits.textlimit,
      uploadlimit: (store) =>
        fileSizeFormatService.fileSizeFormat(store.limits.uploadlimit),
    }),
  },
}

export default FeaturesPanel
