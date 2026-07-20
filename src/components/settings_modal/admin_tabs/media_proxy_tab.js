import AttachmentSetting from '../helpers/attachment_setting.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import ListSetting from '../helpers/list_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import StringSetting from '../helpers/string_setting.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'

const MediaProxyTab = {
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
    AttachmentSetting,
    GroupSetting,
    ListSetting,
  },
  computed: {
    mediaProxyEnabled() {
      return useAdminSettingsStore().draft[':pleroma'][':media_proxy'][
        ':enabled'
      ]
    },
    mediaInvalidationProvider() {
      return useAdminSettingsStore().draft[':pleroma'][':media_proxy'][
        ':invalidation'
      ][':provider']
    },
    ...SharedComputedObject(),
  },
}

export default MediaProxyTab
