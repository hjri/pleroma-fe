import { mapState } from 'pinia'

import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import ProfileSettingIndicator from '../helpers/profile_setting_indicator.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'

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
    ProfileSettingIndicator,
  },
  computed: {
    ...mapState(useInstanceCapabilitiesStore, [
      'postFormats',
      'suggestionsEnabled',
    ]),
    columns() {
      const mode = this.$store.getters.mergedConfig.thirdColumnMode

      const notif = mode === 'none' ? [] : ['notifs']

      if (
        this.$store.getters.mergedConfig.sidebarRight ||
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
