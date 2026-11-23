import { mapState } from 'pinia'

import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

const GeneralTab = {
  components: {
    BooleanSetting,
    ChoiceSetting,
    UnitSetting,
  },
  computed: {
    ...mapState(useInstanceCapabilitiesStore, [
      'postFormats',
      'suggestionsEnabled',
    ]),
    columns() {
      const mode = useMergedConfigStore().mergedConfig.thirdColumnMode

      const notif = mode === 'none' ? [] : ['notifs']

      if (
        useMergedConfigStore().mergedConfig.sidebarRight ||
        mode === 'postform'
      ) {
        return [...notif, 'content', 'sidebar']
      } else {
        return ['sidebar', 'content', ...notif]
      }
    },
    ...SharedComputedObject(),
  },
  methods: {
    updateLayout() {
      useInterfaceStore().setLayoutWidth()
    },
  },
}

export default GeneralTab
