import { useInstanceStore } from 'src/stores/instance.js'
import FeaturesPanel from '../features_panel/features_panel.vue'
import InstanceSpecificPanel from '../instance_specific_panel/instance_specific_panel.vue'
import MRFTransparencyPanel from '../mrf_transparency_panel/mrf_transparency_panel.vue'
import StaffPanel from '../staff_panel/staff_panel.vue'
import TermsOfServicePanel from '../terms_of_service_panel/terms_of_service_panel.vue'

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
      return useInstanceStore().showFeaturesPanel
    },
    showInstanceSpecificPanel() {
      return (
        useInstanceStore().showInstanceSpecificPanel &&
        !this.$store.getters.mergedConfig.hideISP &&
        useInstanceStore().instanceSpecificPanelContent
      )
    },
  },
}

export default About
