import { get } from 'lodash'
import AttachmentSetting from '../helpers/attachment_setting.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import ListSetting from '../helpers/list_setting.vue'
import MapSetting from '../helpers/map_setting.vue'
import ProxySetting from '../helpers/proxy_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import StringSetting from '../helpers/string_setting.vue'
import TupleSetting from '../helpers/tuple_setting.vue'

const HTTPTab = {
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
    MapSetting,
    GroupSetting,
    ListSetting,
    TupleSetting,
    ProxySetting,
  },
  computed: {
    ...SharedComputedObject(),
    sslOptions() {
      const desc = get(
        this.$store.state.adminSettings.descriptions,
        ':pleroma.:http.:adapter.:ssl_options.:versions',
      )
      return new Set(
        desc.suggestions.map((option) => ({
          label: option.replace(':tlsv', 'TLS v'),
          value: option,
        })),
      )
    },
  },
}

export default HTTPTab
