import { mapState } from 'pinia'

import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import FontSetting from '../helpers/font_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import FloatSetting from '../helpers/float_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { updateProfile } from 'src/api/user.js'
import localeService from 'src/services/locale/locale.service.js'

const GeneralTab = {
  data() {
    return {
      emailLanguage: useUsersStore().currentUser?.language || [''],
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    UnitSetting,
    FloatSetting,
    FontSetting,
    InterfaceLanguageSwitcher,
  },
  computed: {
    language: {
      get: function () {
        return useMergedConfigStore().mergedConfig.interfaceLanguage
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
  },
  methods: {
    updateProfile() {
      const params = {
        language: localeService.internalToBackendLocaleMulti(
          this.emailLanguage,
        ),
      }

      updateProfile({
        params,
        credentials: useOAuthStore().token,
      }).then((result) => {
        useUsersStore().addNewUsers(result)
      })
    },
    updateFont(path, value) {
      useLocalConfigStore().set({ path, value })
    },
    toggleStreaming(value) {
      // Streaming is not available for the unauthenticated
      if (!useOAuthStore().token) return

      if (value) {
        useStreamingStore().initSocket()
      } else {
        useStreamingStore().stopSocket()
      }
    },
  },
}

export default GeneralTab
