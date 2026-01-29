import { mapState } from 'pinia'

import FontControl from 'src/components/font_control/font_control.vue'
import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import FloatSetting from '../helpers/float_setting.vue'
import ProfileSettingIndicator from '../helpers/profile_setting_indicator.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceStore } from 'src/stores/instance.js'

import localeService from 'src/services/locale/locale.service.js'

const GeneralTab = {
  props: {
    parentCollapsed: {
      required: true,
      type: Boolean,
    },
  },
  data() {
    return {
      absoluteTime12hOptions: ['24h', '12h'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.absolute_time_format_12h_${mode}`),
      })),
      emailLanguage: this.$store.state.users.currentUser.language || [''],
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    UnitSetting,
    FloatSetting,
    FontControl,
    InterfaceLanguageSwitcher,
    ProfileSettingIndicator,
  },
  computed: {
    language: {
      get: function () {
        return this.$store.getters.mergedConfig.interfaceLanguage
      },
      set: function (val) {
        this.$store.dispatch('setOption', {
          name: 'interfaceLanguage',
          value: val,
        })
      },
    },
    ...SharedComputedObject(),
    ...mapState(useInstanceStore, {
      blockExpirationSupported: (store) => store.featureSet.blockExpiration,
    }),
  },
  methods: {
    updateProfile() {
      const params = {
        language: localeService.internalToBackendLocaleMulti(
          this.emailLanguage,
        ),
      }

      this.$store.state.api.backendInteractor
        .updateProfile({ params })
        .then((user) => {
          this.$store.commit('addNewUsers', [user])
          this.$store.commit('setCurrentUser', user)
        })
    },
    updateFont(key, value) {
      this.$store.dispatch('setOption', {
        name: 'theme3hacks',
        value: {
          ...this.mergedConfig.theme3hacks,
          fonts: {
            ...this.mergedConfig.theme3hacks.fonts,
            [key]: value,
          },
        },
      })
    },
  },
}

export default GeneralTab
