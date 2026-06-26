import FontControl from 'src/components/font_control/font_control.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import UnitSetting from '../helpers/unit_setting.vue'

import { useLocalConfigStore } from 'src/stores/local_config.js'

const PostsTab = {
  data() {
    return {
      conversationDisplayOptions: ['tree', 'linear'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.conversation_display_${mode}`),
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
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    FontControl,
    UnitSetting,
  },
  computed: {
    ...SharedComputedObject(),
  },
  methods: {
    updateFont(path, value) {
      useLocalConfigStore().set({ path, value })
    },
  },
}

export default PostsTab
