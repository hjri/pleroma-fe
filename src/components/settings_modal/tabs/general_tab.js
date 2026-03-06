import { mapState } from 'pinia'

import FontControl from 'src/components/font_control/font_control.vue'
import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import FloatSetting from '../helpers/float_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import localeService from 'src/services/locale/locale.service.js'

const GeneralTab = {
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
  },
  computed: {
    language: {
      get: function () {
        return useSyncConfigStore().mergedConfig.interfaceLanguage
      },
      set: function (val) {
        useSyncConfigStore().setSimplePrefAndSave({
          path: 'interfaceLanguage',
          value: val,
        })
      },
    },
    ...SharedComputedObject(),
    ...mapState(useInstanceCapabilitiesStore, ['blockExpiration']),
    ...mapState(useSyncConfigStore, {
      theme3hacks: (store) => store.mergedConfig.theme3hacks,
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
      useLocalConfigStore().set({
        path: 'theme3hacks',
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
