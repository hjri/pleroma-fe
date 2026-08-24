import { mapState } from 'pinia'

import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import HelpIndicator from '../helpers/help_indicator.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useStatusesStore } from 'src/stores/statuses.js'

const ClutterTab = {
  components: {
    BooleanSetting,
    ChoiceSetting,
    UnitSetting,
    IntegerSetting,
    Checkbox,
    Select,
    HelpIndicator,
  },
  computed: {
    ...SharedComputedObject(),
    ...mapState(useInstanceCapabilitiesStore, ['shoutAvailable']),
    ...mapState(useInstanceStore, {
      showFeaturesPanel: (store) => store.instanceIdentity.showFeaturesPanel,
      instanceSpecificPanelPresent: (store) =>
        store.instanceIdentity.showInstanceSpecificPanel &&
        store.instanceIdentity.instanceSpecificPanelContent,
    }),
  },
  // Updating nested properties
  watch: {
    replyVisibility() {
      useStatusesStore().requireReloadAll()
    },
  },
}

export default ClutterTab
