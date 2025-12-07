import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import StringSetting from '../helpers/string_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import AttachmentSetting from '../helpers/attachment_setting.vue'
import ListSetting from '../helpers/list_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'
import { get } from 'lodash'

const InstanceTab = {
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
    ListSetting,
    GroupSetting
  },
  computed: {
    ...SharedComputedObject(),
    providersOptions () {
      const desc = get(this.$store.state.adminSettings.descriptions, [':pleroma', 'Pleroma.Web.Metadata', ':providers'])
      return new Set(desc.suggestions.map(option => ({
        label: option.replace('Pleroma.Web.Metadata.Providers.', ''),
        value: option
      })))
    },
    limitLocalContentOptions () {
      const desc = get(this.$store.state.adminSettings.descriptions, [':pleroma', ':instance', ':limit_to_local_content'])
      return new Set(desc.suggestions.map(option => ({
        label: option !== 'false' ? this.$t('admin_dash.instance.' + option) : this.$t('general.no'),
        value: option
      })))
    }
  }
}

export default InstanceTab
