import FeaturesPanel from '../features_panel/features_panel.vue'
import InstanceSpecificPanel from '../instance_specific_panel/instance_specific_panel.vue'
import MRFTransparencyPanel from '../mrf_transparency_panel/mrf_transparency_panel.vue'
import StaffPanel from '../staff_panel/staff_panel.vue'
import TermsOfServicePanel from '../terms_of_service_panel/terms_of_service_panel.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

const About = {
  components: {
    InstanceSpecificPanel,
    FeaturesPanel,
    TermsOfServicePanel,
    StaffPanel,
    MRFTransparencyPanel,
  },
  computed: {
    showFeaturesPanel() {
      return useInstanceStore().instanceIdentity.showFeaturesPanel
    },
    showInstanceSpecificPanel() {
      return (
        useInstanceStore().instanceIdentity.showInstanceSpecificPanel &&
        !useSyncConfigStore().mergedConfig.hideISP &&
        useInstanceStore().instanceIdentity.instanceSpecificPanelContent
      )
    },
  },
}

export default About
