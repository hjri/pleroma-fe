import RateSetting from '../helpers/rate_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const RatesTab = {
  provide() {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin',
    }
  },
  components: {
    RateSetting,
  },
  computed: {
    ...SharedComputedObject(),
  },
}

export default RatesTab
