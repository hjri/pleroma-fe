import { useInstanceStore } from 'src/stores/instance.js'
import fileSizeFormatService from '../../services/file_size_format/file_size_format.js'

const FeaturesPanel = {
  computed: {
    shout: function () {
      return useInstanceStore().shoutAvailable
    },
    pleromaChatMessages: function () {
      return useInstanceStore().pleromaChatMessagesAvailable
    },
    gopher: function () {
      return useInstanceStore().gopherAvailable
    },
    whoToFollow: function () {
      return useInstanceStore().suggestionsEnabled
    },
    mediaProxy: function () {
      return useInstanceStore().mediaProxyAvailable
    },
    minimalScopesMode: function () {
      return useInstanceStore().minimalScopesMode
    },
    textlimit: function () {
      return useInstanceStore().textlimit
    },
    uploadlimit: function () {
      return fileSizeFormatService.fileSizeFormat(
        useInstanceStore().uploadlimit,
      )
    },
  },
}

export default FeaturesPanel
