import StatusBookmarkFolderMenu from 'src/components/status_bookmark_folder_menu/status_bookmark_folder_menu.vue'
import EmojiPicker from 'src/components/emoji_picker/emoji_picker.vue'
import Popover from 'src/components/popover/popover.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faPlus,
  faMinus,
  faCheck,
  faTimes,
  faWrench,

  faChevronRight,
  faChevronUp,

  faReply,
  faRetweet,
  faStar,
  faSmileBeam,

  faBookmark,
  faEyeSlash,
  faThumbtack,
  faShareAlt,
  faExternalLinkAlt,
  faHistory
} from '@fortawesome/free-solid-svg-icons'
import {
  faStar as faStarRegular,
  faBookmark as faBookmarkRegular
} from '@fortawesome/free-regular-svg-icons'

library.add(
  faPlus,
  faMinus,
  faCheck,
  faTimes,
  faWrench,

  faChevronRight,
  faChevronUp,

  faReply,
  faRetweet,
  faStar,
  faStarRegular,
  faSmileBeam,

  faBookmark,
  faBookmarkRegular,
  faEyeSlash,
  faThumbtack,
  faShareAlt,
  faExternalLinkAlt,
  faHistory
)

export default {
  props: [
    'button',
    'status',
    'extra',
    'status',
    'funcArg',
    'getClass',
    'getComponent',
    'doAction',
    'outerClose'
  ],
  emits: [
    'interacted'
  ],
  components: {
    StatusBookmarkFolderMenu,
    EmojiPicker,
    Popover
  },
  data: () => ({
    animationState: false
  }),
  computed: {
    buttonClass () {
      return [
        this.button.name + '-button',
        {
          '-with-extra': this.button.name === 'bookmark',
          '-extra': this.extra,
          '-quick': !this.extra
        }
      ]
    },
    userIsMuted () {
      return this.$store.getters.relationship(this.status.user.id).muting
    },
    threadIsMuted () {
      return this.status.thread_muted
    },
    hideCustomEmoji () {
      return !this.$store.state.instance.pleromaCustomEmojiReactionsAvailable
    },
    buttonInnerClass () {
      return [
        this.button.name + '-button',
        {
          'main-button': this.extra,
          'button-unstyled': !this.extra,
          '-active': this.button.active?.(this.funcArg),
          disabled: this.button.interactive ? !this.button.interactive(this.funcArg) : false
        }
      ]
    },
    remoteInteractionLink () {
      return this.$store.getters.remoteInteractionLink({ statusId: this.status.id })
    }
  },
  methods: {
    addReaction (event) {
      const emoji = event.insertion
      const existingReaction = this.status.emoji_reactions.find(r => r.name === emoji)
      if (existingReaction && existingReaction.me) {
        this.$store.dispatch('unreactWithEmoji', { id: this.status.id, emoji })
      } else {
        this.$store.dispatch('reactWithEmoji', { id: this.status.id, emoji })
      }
    },
    doActionWrap (button, close = () => {}) {
      if (this.button.interactive ? !this.button.interactive(this.funcArg) : false) return
      this.$emit('interacted')
      if (button.name === 'emoji') {
        this.$refs.picker.showPicker()
      } else {
        this.animationState = true
        this.getComponent(button) === 'button' && this.doAction(button)
        setTimeout(() => {
          this.animationState = false
        }, 500)
        close()
      }
    }
  }
}
