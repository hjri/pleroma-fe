import { mapState } from 'pinia'

import RichContent from 'src/components/rich_content/rich_content.jsx'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faFile,
  faImage,
  faLink,
  faMusic,
  faPollH,
} from '@fortawesome/free-solid-svg-icons'

library.add(faFile, faMusic, faImage, faLink, faPollH)

const StatusBody = {
  name: 'StatusBody',
  components: {
    RichContent,
  },
  props: {
    status: {
      // Main thing
      type: Object,
      required: true,
    },
    compact: {
      // Resizes emoji and minimizes vertical space used
      // Primarily used for showing status in react notifications
      type: Boolean,
      default: false,
    },
    collapse: {
      // replaces newlines with spaces
      type: Boolean,
      default: false,
    },
    singleLine: {
      // Show entire thing (subject and content) in a single line
      // Primarily used in chats
      type: Boolean,
      default: false,
    },
    inConversation: {
      // Is status rendered within open conversation?
      // Used to automatically expand subjects (if collapsed)
      type: Boolean,
      default: false,
    },
    ignoreSubject: {
      // Pretend subject line doesn't exist. Useful for chat messages
      // to indicate what post reply belongs to
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      postLength: this.status.text.length,
      parseReadyDone: false,
      showingTall: false,
      showingLongSubject: false,
      expandingSubject: null,
    }
  },
  emits: ['parseReady'],
  computed: {
    allowNonSquareEmoji() {
      return this.mergedConfig.nonSquareEmoji
    },
    pauseMfm() {
      return this.mergedConfig.pauseMfm
    },
    scaleMfm() {
      return this.mergedConfig.scaleMfm
    },
    // This is a bit hacky, but we want to approximate post height before rendering
    // so we count newlines (masto uses <p> for paragraphs, GS uses <br> between them)
    // as well as approximate line count by counting characters and approximating ~80
    // per line.
    //
    // Using max-height + overflow: auto for status components resulted in false positives
    // very often with japanese characters, and it was very annoying.
    hasLongSubject() {
      return this.status.summary.length > 240
    },
    hasSubject() {
      return !!this.status.summary && !this.ignoreSubject
    },
    // When a status has a subject and is also tall, we should only have one show more/less
    // button. If the default is to collapse statuses with subjects, we just treat it like
    // a status with a subject; otherwise, we just treat it like a tall status.
    mightHideBecauseSubject() {
      return (
        !this.inConversation &&
        this.hasSubject &&
        this.mergedConfig.collapseMessageWithSubject
      )
    },
    mightHideBecauseTall() {
      if (this.singleLine || this.compact) return false
      const lengthScore =
        this.status.raw_html.split(/<p|<br/).length + this.postLength / 80
      return lengthScore > 20
    },
    hideSubjectStatus() {
      return this.mightHideBecauseSubject && !this.expandingSubject
    },
    hideTallStatus() {
      return this.mightHideBecauseTall && !this.showingTall
    },
    shouldShowExpandToggle() {
      return this.mightHideBecauseSubject || this.mightHideBecauseTall
    },
    toggleButtonClasses() {
      return {
        'cw-status-hider': !this.showingMore && this.mightHideBecauseSubject,
        'tall-status-hider': !this.showingMore && this.mightHideBecauseTall,
        'status-unhider': this.showingMore,
      }
    },
    toggleText() {
      if (this.showingMore) {
        return this.mightHideBecauseSubject
          ? this.$t('status.hide_content')
          : this.$t('general.show_less')
      } else {
        return this.mightHideBecauseSubject
          ? this.$t('status.show_content')
          : this.$t('general.show_more')
      }
    },
    shouldHide() {
      return (
        !this.showingMore && this.mightHideBecauseSubject && this.hasSubject
      )
    },
    showingMore() {
      return (
        (this.mightHideBecauseTall && this.showingTall) ||
        (this.mightHideBecauseSubject && this.expandingSubject)
      )
    },
    attachmentTypes() {
      return this.status.attachments.map((file) => file.type)
    },
    collapsedStatus() {
      return this.status.raw_html.replaceAll(/(\n|<br\s?\/?>)/g, ' ')
    },
    ...mapState(useMergedConfigStore, ['mergedConfig']),
  },
  mounted() {
    this.status.attentions?.forEach((attn) => {
      const { id } = attn
      useUsersStore().fetchUserIfMissing({ id })
    })
  },
  methods: {
    onParseReady(event) {
      if (this.parseReadyDone) return
      this.parseReadyDone = true
      this.$emit('parseReady', event)
      const { writtenMentions, invisibleMentions } = event
      writtenMentions
        .filter((mention) => !mention.notifying)
        .forEach((mention) => {
          const { content, url } = mention
          const cleanedString = content.replaceAll(/<[^>]+?>/gi, '') // remove all tags
          if (!cleanedString.startsWith('@')) return
          const handle = cleanedString.slice(1)
          const host = url.replace(/^https?:\/\//, '').replace(/\/.+?$/, '')
          useUsersStore().fetchUserIfMissing({ name: `${handle}@${host}` })
        })
      /* This is a bit of a hack to make current tall status detector work
       * with rich mentions. Invisible mentions are detected at RichContent level
       * and also we generate plaintext version of mentions by stripping tags
       * so here we subtract from post length by each mention that became invisible
       * via MentionsLine
       */
      this.postLength = invisibleMentions.reduce((acc, mention) => {
        return acc - mention.textContent.length - 1
      }, this.postLength)
    },
    toggleShowMore() {
      if (this.mightHideBecauseTall) {
        this.showingTall = !this.showingTall
      } else if (this.mightHideBecauseSubject) {
        this.expandingSubject = !this.expandingSubject
      }
    },
    generateTagLink(tag) {
      return `/tag/${tag}`
    },
  },
}

export default StatusBody
