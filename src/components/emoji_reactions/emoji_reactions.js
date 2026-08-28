import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserListPopover from 'src/components/user_list_popover/user_list_popover.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheck, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'

library.add(faPlus, faMinus, faCheck)

const EMOJI_REACTION_COUNT_CUTOFF = 12

const EmojiReactions = {
  name: 'EmojiReactions',
  components: {
    UserAvatar,
    UserListPopover,
  },
  props: ['status'],
  data: () => ({
    showAll: false,
  }),
  computed: {
    tooManyReactions() {
      return this.status.emoji_reactions.length > EMOJI_REACTION_COUNT_CUTOFF
    },
    emojiReactions() {
      return this.showAll
        ? this.status.emoji_reactions
        : this.status.emoji_reactions.slice(0, EMOJI_REACTION_COUNT_CUTOFF)
    },
    showMoreString() {
      return `+${this.status.emoji_reactions.length - EMOJI_REACTION_COUNT_CUTOFF}`
    },
    accountsForEmoji() {
      return this.status.emoji_reactions.reduce((acc, reaction) => {
        acc.set(reaction.name, new Set(reaction.account_ids))
        return acc
      }, new Map())
    },
    loggedIn() {
      return !!useUsersStore().currentUser
    },
    remoteInteractionLink() {
      return useInstanceStore().getRemoteInteractionLink({
        statusId: this.status.id,
      })
    },
    allowNonSquareEmoji() {
      return useMergedConfigStore().mergedConfig.nonSquareEmoji
    },
  },
  methods: {
    toggleShowAll() {
      this.showAll = !this.showAll
    },
    reactedWith(emoji) {
      return this.status.emoji_reactions.find((r) => r.name === emoji).me
    },
    async fetchEmojiReactionsIfMissing() {
      const hasNoAccounts = this.status.emoji_reactions.find((r) => !r.accounts)
      if (hasNoAccounts) {
        return await useStatusesStore().fetchEmojiReactions(this.status.id)
      }
    },
    reactWith(emoji) {
      useStatusesStore().reactWithEmoji(this.status.id, emoji)
    },
    unreact(emoji) {
      useStatusesStore().unreactWithEmoji(this.status.id, emoji)
    },
    async emojiOnClick(emoji) {
      if (!this.loggedIn) return

      await this.fetchEmojiReactionsIfMissing()
      if (this.reactedWith(emoji)) {
        this.unreact(emoji)
      } else {
        this.reactWith(emoji)
      }
    },
    counterTriggerAttrs(reaction) {
      return {
        class: [
          'emoji-reaction-count-button',
          {
            '-picked-reaction': this.reactedWith(reaction.name),
            toggled: this.reactedWith(reaction.name),
          },
        ],
        'aria-label': this.$t(
          'status.reaction_count_label',
          { num: reaction.count },
          reaction.count,
        ),
      }
    },
  },
}

export default EmojiReactions
