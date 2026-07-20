import { mapState } from 'pinia'

import fileSizeFormatService from '../../services/file_size_format/file_size_format.js'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'

const FeaturesPanel = {
  computed: {
    ...mapState(useInstanceCapabilitiesStore, [
      'shoutAvailable',
      'pleromaChatMessagesAvailable',
      'gopherAvailable',
      'suggestionsEnabled',
      'mediaProxyAvailable',
    ]),
    ...mapState(useInstanceStore, {
      textLimit: (store) => store.limits.textLimit,
      uploadlimit: (store) =>
        fileSizeFormatService.fileSizeFormat(store.limits.uploadlimit),
    }),
  },
}

export default FeaturesPanel
