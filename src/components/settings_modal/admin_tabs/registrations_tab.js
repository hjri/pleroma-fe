import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import StringSetting from '../helpers/string_setting.vue'
import TupleSetting from '../helpers/tuple_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import AttachmentSetting from '../helpers/attachment_setting.vue'
import ListSetting from '../helpers/list_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const RegistrationsTab = {
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
    TupleSetting,
    AttachmentSetting,
    GroupSetting,
    ListSetting,
  },
  computed: {
    ...SharedComputedObject(),
  },
}

export default RegistrationsTab
