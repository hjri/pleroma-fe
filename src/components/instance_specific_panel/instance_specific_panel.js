import { useInstanceStore } from 'src/stores/instance.js'

const InstanceSpecificPanel = {
  computed: {
    instanceSpecificPanelContent() {
      return useInstanceStore().instanceIdentity.instanceSpecificPanelContent
    },
  },
}

export default InstanceSpecificPanel
