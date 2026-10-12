import Popover from 'src/components/popover/popover.vue'
import StatusBookmarkFolderMenu from 'src/components/status_bookmark_folder_menu/status_bookmark_folder_menu.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBookmark as faBookmarkRegular,
  faFaceSmileBeam,
  faStar as faStarRegular,
} from '@fortawesome/free-regular-svg-icons'
import {
  faBookmark,
  faCheck,
  faChevronDown,
  faChevronRight,
  faComments,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faHistory,
  faList,
  faMinus,
  faPencil,
  faPlus,
  faReply,
  faRetweet,
  faShareAlt,
  faStar,
  faThumbtack,
  faTimes,
  faWrench,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faPlus,
  faMinus,
  faCheck,
  faTimes,
  faWrench,

  faChevronRight,
  faChevronDown,

  faReply,
  faRetweet,
  faStar,
  faStarRegular,
  faFaceSmileBeam,

  faBookmark,
  faBookmarkRegular,
  faEyeSlash,
  faEye,
  faThumbtack,
  faPencil,
  faShareAlt,
  faComments,
  faList,
  faExternalLinkAlt,
  faHistory,
)

export default {
  props: {
    button: Object,
    status: Object,
    extra: Boolean,
    funcArg: Object,
    getClass: Function,
    getComponent: Function,
    doAction: Function,
    outerClose: Function,
    defaultButtonStyle: Boolean,
    hideLabel: Boolean,
    popoverTrigger: Boolean,
  },
  components: {
    StatusBookmarkFolderMenu,
    Popover,
  },
  data: () => ({
    animationState: false,
  }),
  computed: {
    buttonClass() {
      return [
        this.button.name + '-button',
        {
          '-with-extra': this.button.name === 'bookmark',
          '-extra': this.extra,
          '-quick': !this.extra,
        },
      ]
    },
    userIsMuted() {
      return useUsersStore().relationship(this.status.user.id).muting
    },
    threadIsMuted() {
      return this.status.thread_muted
    },
    hideCustomEmoji() {
      return !useInstanceCapabilitiesStore()
        .pleromaCustomEmojiReactionsAvailable
    },
    hidePostStats() {
      return useMergedConfigStore().mergedConfig.hidePostStats
    },
    buttonInnerClass() {
      const buttonStyleClass = this.defaultButtonStyle
        ? 'button-default'
        : 'button-unstyled'
      return [
        this.button.name + '-button',
        {
          'main-button': this.extra,
          [buttonStyleClass]: !this.extra,
          '-active': this.button.active?.(this.funcArg),
          disabled: this.button.interactive
            ? !this.button.interactive(this.funcArg)
            : false,
        },
      ]
    },
    remoteInteractionLink() {
      return useInstanceStore().getRemoteInteractionLink({
        statusId: this.status.id,
      })
    },
    isInteractive() {
      return this.functionWrap('interactive', true)(this.funcArg)
    },
    href() {
      if (this.getComponent(this.button) !== 'a') return undefined
      return this.functionWrap('link', remoteInteractionLink)(this.funcArg) ?? remoteInteractionLink
    }
  },
  methods: {
    functionWrap(property, fallback) {
      const isFunction = typeof this.button[property] === 'function'

      return isFunction
        ? this.button[property]
        : () => this.button[property] ?? fallback
    },
    doActionWrap(
      button,
      close = () => {
        /* no-op */
      },
    ) {
      if (!this.isInteractive) return
      this.animationState = true
      this.getComponent(button) === 'button' && this.doAction(button)
      setTimeout(() => {
        this.animationState = false
      }, 500)
      if (!this.button.dropdown) close()
    },
  },
}
