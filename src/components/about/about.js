import { mapState } from 'pinia'

import FeaturesPanel from '../features_panel/features_panel.vue'
import InstanceSpecificPanel from '../instance_specific_panel/instance_specific_panel.vue'
import MRFTransparencyPanel from '../mrf_transparency_panel/mrf_transparency_panel.vue'
import StaffPanel from '../staff_panel/staff_panel.vue'
import TermsOfServicePanel from '../terms_of_service_panel/terms_of_service_panel.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

const pleromaFeCommitUrl =
  'https://git.pleroma.social/pleroma/pleroma-fe/commit/'

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
    frontendVersionLink() {
      return pleromaFeCommitUrl + this.frontendVersion
    },
    ...mapState(useInstanceStore, [
      'backendVersion',
      'backendRepository',
      'frontendVersion',
    ]),
    showInstanceSpecificPanel() {
      return (
        useInstanceStore().instanceIdentity.showInstanceSpecificPanel &&
        !useMergedConfigStore().mergedConfig.hideISP &&
        useInstanceStore().instanceIdentity.instanceSpecificPanelContent
      )
    },
  },
}

export default About
