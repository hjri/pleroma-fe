import { useInstanceStore } from 'src/stores/instance.js'

const InstanceSpecificPanel = {
  computed: {
    instanceSpecificPanelContent() {
      return useInstanceStore().instanceSpecificPanelContent
    },
  },
}

export default InstanceSpecificPanel
