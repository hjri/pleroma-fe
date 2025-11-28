import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import StringSetting from '../helpers/string_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import AttachmentSetting from '../helpers/attachment_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const MediaProxyTab = {
  provide () {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin'
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    StringSetting,
    AttachmentSetting,
    GroupSetting
  },
  computed: {
    mediaProxyEnabled () {
      return this.$store.state.adminSettings.draft[':pleroma'][':media_proxy'][':enabled']
    },
    mediaInvalidationProvider () {
      return this.$store.state.adminSettings.draft[':pleroma'][':media_proxy'][':invalidation'][':provider']
    },
    ...SharedComputedObject()
  }
}

export default MediaProxyTab
