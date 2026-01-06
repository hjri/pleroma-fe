import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import StringSetting from '../helpers/string_setting.vue'
import ColorSetting from '../helpers/color_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import AttachmentSetting from '../helpers/attachment_setting.vue'
import ListSetting from '../helpers/list_setting.vue'
import PWAManifestIconsSetting from '../helpers/pwa_manifest_icons_setting.vue'
import MapSetting from '../helpers/map_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const OtherTab = {
  provide() {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin',
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    StringSetting,
    ColorSetting,
    AttachmentSetting,
    ListSetting,
    PWAManifestIconsSetting,
    MapSetting,
    GroupSetting,
  },
  computed: {
    ...SharedComputedObject(),
  },
}

export default OtherTab
