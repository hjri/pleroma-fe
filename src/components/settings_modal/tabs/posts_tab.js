import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import ProfileSettingIndicator from '../helpers/profile_setting_indicator.vue'
import FontControl from 'src/components/font_control/font_control.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const GeneralTab = {
  props: {
    parentCollapsed: {
      required: true,
      type: Boolean
    }
  },
  data () {
    return {
      conversationDisplayOptions: ['tree', 'linear'].map(mode => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.conversation_display_${mode}`)
      })),
      conversationOtherRepliesButtonOptions: ['below', 'inside'].map(mode => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.conversation_other_replies_button_${mode}`)
      })),
      mentionLinkDisplayOptions: ['short', 'full_for_remote', 'full'].map(mode => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.mention_link_display_${mode}`)
      })),
      userPopoverAvatarActionOptions: ['close', 'zoom', 'open'].map(mode => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.user_popover_avatar_action_${mode}`)
      })),
      unsavedPostActionOptions: ['save', 'discard', 'confirm'].map(mode => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.unsaved_post_action_${mode}`)
      })),
      loopSilentAvailable:
      // Firefox
      Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'mozHasAudio') ||
      // Chrome-likes
      Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'webkitAudioDecodedByteCount') ||
      // Future spec, still not supported in Nightly 63 as of 08/2018
      Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'audioTracks')
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    FontControl,
    ProfileSettingIndicator
  },
  computed: {
    ...SharedComputedObject(),
  },
  methods: {
    updateFont (key, value) {
      this.$store.dispatch('setOption', {
        name: 'theme3hacks',
        value: {
          ...this.mergedConfig.theme3hacks,
          fonts: {
            ...this.mergedConfig.theme3hacks.fonts,
            [key]: value
          }
        }
      })
    },
  }
}

export default GeneralTab
