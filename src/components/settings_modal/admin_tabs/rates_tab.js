import RateSetting from '../helpers/rate_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

const RatesTab = {
  components: {
    RateSetting,
  },
  computed: {
    ...SharedComputedObject(),
  },
}

export default RatesTab
