import { mapState } from 'pinia'

import FontControl from 'src/components/font_control/font_control.vue'
import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import ScopeSelector from 'src/components/scope_selector/scope_selector.vue'
import Select from 'src/components/select/select.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import FloatSetting from '../helpers/float_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import { updateProfile } from 'src/api/user.js'
import localeService from 'src/services/locale/locale.service.js'
import { cacheKey, clearCache, emojiCacheKey } from 'src/services/sw/sw.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faDatabase,
  faGlobe,
  faMessage,
  faPenAlt,
  faSliders,
} from '@fortawesome/free-solid-svg-icons'

library.add(faGlobe, faMessage, faPenAlt, faDatabase, faSliders)

const ComposingTab = {
  data() {
    return {
      subjectLineOptions: ['email', 'noop', 'masto'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(
          `settings.subject_line_${mode === 'masto' ? 'mastodon' : mode}`,
        ),
      })),
      conversationDisplayOptions: ['tree', 'linear'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.conversation_display_${mode}`),
      })),
      absoluteTime12hOptions: ['24h', '12h'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.absolute_time_format_12h_${mode}`),
      })),
      conversationOtherRepliesButtonOptions: ['below', 'inside'].map(
        (mode) => ({
          key: mode,
          value: mode,
          label: this.$t(`settings.conversation_other_replies_button_${mode}`),
        }),
      ),
      mentionLinkDisplayOptions: ['short', 'full_for_remote', 'full'].map(
        (mode) => ({
          key: mode,
          value: mode,
          label: this.$t(`settings.mention_link_display_${mode}`),
        }),
      ),
      userPopoverAvatarActionOptions: ['close', 'zoom', 'open'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.user_popover_avatar_action_${mode}`),
      })),
      unsavedPostActionOptions: ['save', 'discard', 'confirm'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.unsaved_post_action_${mode}`),
      })),
      loopSilentAvailable:
        // Firefox
        Object.getOwnPropertyDescriptor(
          HTMLVideoElement.prototype,
          'mozHasAudio',
        ) ||
        // Chrome-likes
        Object.getOwnPropertyDescriptor(
          HTMLMediaElement.prototype,
          'webkitAudioDecodedByteCount',
        ) ||
        // Future spec, still not supported in Nightly 63 as of 08/2018
        Object.getOwnPropertyDescriptor(
          HTMLMediaElement.prototype,
          'audioTracks',
        ),
      emailLanguage: this.$store.state.users.currentUser.language || [''],
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    FloatSetting,
    UnitSetting,
    InterfaceLanguageSwitcher,
    ScopeSelector,
    Select,
    FontControl,
  },
  computed: {
    postFormats() {
      return useInstanceCapabilitiesStore().postFormats
    },
    postContentOptions() {
      return this.postFormats.map((format) => ({
        key: format,
        value: format,
        label: this.$t(`post_status.content_type["${format}"]`),
      }))
    },
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
    ...mapState(useInstanceStore, ['blockExpiration']),
  },
  methods: {
    changeDefaultScope(value) {
      this.$store.dispatch('setProfileOption', { name: 'defaultScope', value })
    },
    clearCache(key) {
      clearCache(key)
        .then(() => {
          this.$store.dispatch('settingsSaved', { success: true })
        })
        .catch((error) => {
          this.$store.dispatch('settingsSaved', { error })
        })
    },
    tooSmall() {
      this.$emit('tooSmall')
    },
    tooBig() {
      this.$emit('tooBig')
    },
    getNavMode() {
      return this.$refs.tabSwitcher.getNavMode()
    },
    clearAssetCache() {
      this.clearCache(cacheKey)
    },
    clearEmojiCache() {
      this.clearCache(emojiCacheKey)
    },
    updateProfile() {
      const params = {
        language: localeService.internalToBackendLocaleMulti(
          this.emailLanguage,
        ),
      }

      updateProfile({
        params,
        credentials: useOAuthStore().token,
      }).then((user) => {
        this.$store.commit('addNewUsers', [user])
        this.$store.commit('setCurrentUser', user)
      })
    },
    updateFont(key, value) {
      useSyncConfigStore().setSimplePrefAndSave({
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

export default ComposingTab
