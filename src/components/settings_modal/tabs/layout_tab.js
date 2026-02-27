import { mapState } from 'pinia'

import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

const GeneralTab = {
  data() {
    return {
      thirdColumnModeOptions: ['none', 'notifications', 'postform'].map(
        (mode) => ({
          key: mode,
          value: mode,
          label: this.$t(`settings.third_column_mode_${mode}`),
        }),
      ),
    }
  },
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
      const mode = useSyncConfigStore().mergedConfig.thirdColumnMode

      const notif = mode === 'none' ? [] : ['notifs']

      if (
        useSyncConfigStore().mergedConfig.sidebarRight ||
        mode === 'postform'
      ) {
        return [...notif, 'content', 'sidebar']
      } else {
        return ['sidebar', 'content', ...notif]
      }
    },
    ...SharedComputedObject(),
  },
}

export default GeneralTab
