import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import StringSetting from '../helpers/string_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const UploadsTab = {
  provide() {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin',
    }
  },
  data() {
    return {
      uploaders: [
        {
          key: 'Pleroma.Uploaders.Local',
          value: 'Pleroma.Uploaders.Local',
          label: this.$t('admin_dash.uploads.local_uploader'),
        },
        {
          key: 'Pleroma.Uploaders.IPFS',
          value: 'Pleroma.Uploaders.IPFS',
          label: 'IPFS',
        },
        {
          key: 'Pleroma.Uploaders.S3',
          value: 'Pleroma.Uploaders.S3',
          label: 'S3',
        },
      ],
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    StringSetting,
  },
  computed: {
    uploader() {
      return this.$store.state.adminSettings.draft[':pleroma'][
        'Pleroma.Upload'
      ][':uploader']
    },
    ...SharedComputedObject(),
  },
}

export default UploadsTab
