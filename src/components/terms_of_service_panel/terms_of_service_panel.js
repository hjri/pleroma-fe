import { mapState } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'

const TermsOfServicePanel = {
  computed: mapState(useInstanceStore, {
    content: (store) => store.instanceIdentity.tos,
    embedded: (store) => store.instanceIdentity.embeddedToS,
  }),
}

export default TermsOfServicePanel
