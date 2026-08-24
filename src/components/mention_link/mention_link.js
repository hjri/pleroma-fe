import { mapState } from 'pinia'

import UnicodeDomainIndicator from 'src/components/unicode_domain_indicator/unicode_domain_indicator.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'
import {
  highlightClass,
  highlightStyle,
} from '../../services/user_highlighter/user_highlighter.js'

import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'
import { useUsersStore } from 'src/stores/users.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faAt } from '@fortawesome/free-solid-svg-icons'

library.add(faAt)

const MentionLink = {
  name: 'MentionLink',
  components: {
    UserAvatar,
    UnicodeDomainIndicator,
    UserPopover,
  },
  props: {
    url: {
      required: true,
      type: String,
    },
    content: {
      required: true,
      type: String,
    },
    userId: {
      required: false,
      type: String,
    },
    userScreenName: {
      required: false,
      type: String,
    },
  },
  data() {
    return {
      hasSelection: false,
    }
  },
  methods: {
    onClick() {
      if (this.shouldShowTooltip) return
      const link = generateProfileLink(
        this.userId || this.user.id,
        this.userScreenName || this.user.screen_name,
      )
      this.$router.push(link)
    },
    handleSelection() {
      if (this.$refs.full) {
        this.hasSelection = document
          .getSelection()
          .containsNode(this.$refs.full, true)
      }
    },
  },
  mounted() {
    document.addEventListener('selectionchange', this.handleSelection)
  },
  unmounted() {
    document.removeEventListener('selectionchange', this.handleSelection)
  },
  computed: {
    user() {
      return this.url && useUsersStore().findUserByUrl(this.url)
    },
    isYou() {
      if (!this.currentUser) return false
      return this.user === this.currentUser
    },
    userName() {
      return this.user && this.userNameFullUi.split('@')[0]
    },
    serverName() {
      // XXX assumed that domain does not contain @
      return (
        this.user &&
        (this.userNameFullUi.split('@')[1] || useInstanceStore().instanceDomain)
      )
    },
    userNameFull() {
      return this.user?.screen_name
    },
    userNameFullUi() {
      return this.user?.screen_name_ui
    },
    highlightData() {
      return this.highlight[this.user?.screen_name]
    },
    highlightType() {
      return this.highlightData && '-' + this.highlightData.type
    },
    highlightClass() {
      return this.highlightData && highlightClass(this.user)
    },
    style() {
      if (this.highlightData) {
        const {
          backgroundColor,
          backgroundPosition,
          backgroundImage,
          ...rest
        } = highlightStyle(this.highlightData)
        return rest
      }
    },
    classnames() {
      return [
        {
          '-you': this.isYou && this.shouldBoldenYou,
          '-highlighted': !!this.highlightData,
          '-has-selection': this.hasSelection,
        },
        this.highlightType,
      ]
    },
    isRemote() {
      return this.userName !== this.userNameFull
    },
    shouldShowFullUserName() {
      const conf = this.mergedConfig.mentionLinkDisplay
      if (conf === 'short') {
        return false
      } else if (conf === 'full') {
        return true
      } else {
        // full_for_remote
        return this.isRemote
      }
    },
    shouldShowTooltip() {
      return this.mergedConfig.mentionLinkShowTooltip
    },
    shouldShowAvatar() {
      return this.mergedConfig.mentionLinkShowAvatar
    },
    shouldShowYous() {
      return this.mergedConfig.mentionLinkShowYous
    },
    shouldBoldenYou() {
      return this.mergedConfig.mentionLinkBoldenYou
    },
    shouldFadeDomain() {
      return this.mergedConfig.mentionLinkFadeDomain
    },
    ...mapState(useMergedConfigStore, ['mergedConfig']),
    ...mapState(useUserHighlightStore, ['highlight']),
    ...mapState(useUsersStore, ['currentUser']),
  },
}

export default MentionLink
