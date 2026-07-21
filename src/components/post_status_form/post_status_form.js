import { debounce, reject, uniqBy } from 'lodash'
import { mapActions, mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import Attachment from 'src/components/attachment/attachment.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import DraftCloser from 'src/components/draft_closer/draft_closer.vue'
import EmojiInput from 'src/components/emoji_input/emoji_input.vue'
import suggestor from 'src/components/emoji_input/suggestor.js'
import Gallery from 'src/components/gallery/gallery.vue'
import MediaUpload from 'src/components/media_upload/media_upload.vue'
import Popover from 'src/components/popover/popover.vue'
import ScopeSelector from 'src/components/scope_selector/scope_selector.vue'
import Select from 'src/components/select/select.vue'
import StatusContent from 'src/components/status_content/status_content.vue'
import { propsToNative } from '../../services/attributes_helper/attributes_helper.service.js'
import { findOffset } from '../../services/offset_finder/offset_finder.service.js'
import genRandomSeed from '../../services/random_seed/random_seed.service.js'
import statusPoster from '../../services/status_poster/status_poster.service.js'

import { useEmojiStore } from 'src/stores/emoji.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMediaViewerStore } from 'src/stores/media_viewer.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import { pollFormToMasto } from 'src/services/poll/poll.service.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBan,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircleNotch,
  faPollH,
  faQuoteRight,
  faSmileBeam,
  faTimes,
  faUpload,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faSmileBeam,
  faPollH,
  faUpload,
  faQuoteRight,
  faBan,
  faTimes,
  faCircleNotch,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
)

// Converts a string with px to a number like '2px' -> 2
const pxStringToNumber = (str) => {
  return Number(str.substring(0, str.length - 2))
}

const DEFAULT_NEWSTATUS = {
}

const PostStatusForm = {
  props: {
    // Status editing stuff
    statusId: String,
    statusText: String,
    statusIsSensitive: {
      type: Boolean,
      required: false,
      default: null, // Avoiding automatic conversion null -> false
    },
    statusPoll: Object,
    statusQuote: Object,
    statusFiles: Array,
    statusMediaDescriptions: Object,
    statusScope: String,
    statusContentType: String,
    // Replies/mentions
    replyTo: String,
    repliedUser: Object,
    mentionsLine: Boolean,
    mentionsLineReadOnly: Boolean,
    attentions: Array,
    subject: String,
    copyMessageScope: String,
    profileMention: String,
    // Draft stuff
    hideDraft: Boolean,
    closeable: Boolean,
    draftId: String,
    // Chats stuff
    maxHeight: Number,
    placeholder: String,
    postHandler: Function,
    preserveFocus: Boolean,
    autoFocus: Boolean,
    fileLimit: Number,
    submitOnEnter: Boolean,
    emojiPickerPlacement: String,
    optimisticPosting: Boolean,
    // Feature toggles for special cases (mostly chats)
    disableSubject: Boolean,
    disableScopeSelector: Boolean,
    disableVisibilitySelector: Boolean,
    disableNotice: Boolean,
    disableLockWarning: Boolean,
    disablePolls: Boolean,
    disableQuotes: Boolean,
    disableSensitivityCheckbox: Boolean,
    disableSubmit: Boolean,
    disablePreview: Boolean,
    disableDraft: Boolean,
  },
  emits: [
    'posted',
    'draft-done',
    'resize',
    'mediaplay',
    'mediapause',
    'close-accepted',
    'update',
  ],
  data() {
    return {
      randomSeed: genRandomSeed(),
      dropFiles: [],
      uploadingFiles: false,
      error: null,
      posting: false,
      highlighted: 0,
      initialized: false,
      // Data is initialized first, but we have no access to .computed
      // so we pre-fill with stuff meant for status editing and later
      // back-fill with defaults in .created()
      newStatus: {
        status: this.statusText ?? null,
        mentions: this.statusMentionLine ?? null,
        spoilerText: this.subject ?? null,
        quote: this.statusQuote ?? null,
        files: this.statusFiles ?? null,
        poll: this.statusPoll ?? null,
        mediaDescriptions: this.statusMediaDescriptions ?? null,
        nsfw: this.statusIsSensitive ?? null,
        visibility: this.statusVisibility ?? null,
        contentType: this.statusContentType ?? null,
      },
      caret: 0,
      showDropIcon: 'hide',
      dropStopTimeout: null,
      preview: null,
      previewLoading: false,
      emojiInputShown: false,
      idempotencyKey: '',
      saveInhibited: true,
      saveable: false,
    }
  },
  components: {
    MediaUpload,
    EmojiInput,
    PollForm: defineAsyncComponent(
      () => import('src/components/poll/poll_form.vue'),
    ),
    QuoteForm: defineAsyncComponent(
      () => import('src/components/quote/quote_form.vue'),
    ),
    ScopeSelector,
    Checkbox,
    Select,
    Attachment,
    StatusContent,
    Gallery,
    DraftCloser,
    Popover,
  },
  created() {
    // If we are starting a new post, do not associate it with old drafts
    const draft = !this.disableDraft && (this.draftId || this.statusType !== 'new')
        ? this.getDraft(this.statusType, this.refId)
        : null

    if (draft) {
      // Copying and overriding defaults from the draft for each field
      Object.keys(this.newStatus).forEach((key) => {
        this.newStatus[key] = draft[key] ?? this.newStatus[key]
      })
    } else {
      const defaultNewStatus = {
        spoilerText: '',
        files: [],
        poll: null,
        quote: null,
        mediaDescriptions: {},
      }

      const scope =
            (this.copyMessageScope && this.userDefaultScopeCopy) ||
        this.copyMessageScope === 'direct'
          ? this.copyMessageScope
          : this.userDefaultScope

      const preset = this.$route.query.message
      let statusText = preset ?? ''

      if (this.mentionsLine) {
        defaultNewStatus.status = statusText
        defaultNewStatus.mentions = this.mentionsString.trim()
      } else {
        defaultNewStatus.status = this.mentionsString + statusText
        defaultNewStatus.mentions = ''
      }

      defaultNewStatus.nsfw = this.userDefaultSensitive
      defaultNewStatus.visibility = scope
      defaultNewStatus.contentType = this.userDefaultPostContentType

      Object.entries(defaultNewStatus).forEach(([key, value]) => {
        this.newStatus[key] = this.newStatus[key] ?? value
      })
    }
    this.initialized = true
  },
  mounted() {
    this.updateIdempotencyKey()
    this.resize(this.$refs.textarea)

    if (this.replyTo) {
      const textLength = this.$refs.textarea.value.length
      this.$refs.textarea.setSelectionRange(textLength, textLength)
    }

    if (this.replyTo || this.autoFocus) {
      this.$refs.textarea.focus()
    }
  },
  computed: {
    // Visibility / expansion state of subcomponents
    pollFormVisible() {
      return this.hasPoll
    },
    quoteFormVisible() {
      return this.hasQuote && !this.newStatus.quote.thread
    },
    showPreview() {
      return !this.disablePreview && (!!this.preview || this.previewLoading)
    },

    // Composition stuff
    statusType() {
      if (this.replyTo) {
        return 'reply'
      } else if (this.profileMention && this.repliedUser?.id) {
        return 'mention'
      } else if (this.statusId) {
        return 'edit'
      } else {
        return 'new'
      }
    },
    refId() {
      if (this.replyTo) {
        return this.replyTo
      } else if (profileMention) {
        return this.profileMention && this.repliedUser?.id
      } else if (statusId) {
        return this.statusId
      } else {
        return null
      }
    },
    mentionsString() {
      if (this.statusType !== 'reply' && this.statusType !== 'mention') return ''
      let allAttentions = [...(this.attentions || [])]

      allAttentions.unshift(this.repliedUser)

      allAttentions = uniqBy(allAttentions, 'id')
      allAttentions = reject(allAttentions, { id: this.currentUser.id })

      const mentions = allAttentions.map((attention) => `@${attention.screen_name}`)

      return mentions.length > 0 ? mentions.join(' ') + ' ' : ''
    },
    newStatusContent() {
      return this.mentionsLine
        ? this.mentionsString + this.newStatus.status
        : this.newStatus.status
    },
    isEdit() {
      return typeof this.statusId !== 'undefined' && this.statusId.trim() !== ''
    },
    // -Reply
    isReply() {
      return this.statusType === 'reply'
    },
    inReplyStatusId() {
      return !this.hasQuote ||
        !this.newStatus.quote.thread ||
        !this.newStatus.quote.id
        ? this.replyTo
        : undefined
    },
    // -Poll
    hasPoll() {
      return this.newStatus.poll != null
    },
    // -Quotes
    hasQuote() {
      return this.newStatus.quote !== null
    },
    quotable() {
      return this.quotingAvailable && this.replyTo
    },
    defaultQuotable() {
      if (
        !this.quotingAvailable ||
        !this.isReply ||
        !useMergedConfigStore().mergedConfig.quoteReply
      ) {
        return false
      }

      const repliedStatus =
        this.$store.state.statuses.allStatusesObject[this.replyTo]
      if (!repliedStatus) {
        return false
      }

      if (
        repliedStatus.visibility === 'public' ||
        repliedStatus.visibility === 'unlisted' ||
        repliedStatus.visibility === 'local'
      ) {
        return true
      } else if (repliedStatus.visibility === 'private') {
        return repliedStatus.user.id === this.currentUser.id
      }

      return false
    },
    quoteId() {
      return this.newStatus.quote?.id
    },
    quoteThreadToggled: {
      get() {
        return this.newStatus.quote?.thread
      },
      set(value) {
        if (value) {
          this.newStatus.quote = {}
          this.newStatus.quote.thread = value
          this.newStatus.quote.id = value ? this.replyTo : ''
        } else {
          this.newStatus.quote = null
        }
      },
    },

    // Emoji stuff
    emojiUserSuggestor() {
      return suggestor({
        emoji: [
          ...useEmojiStore().standardEmojiList,
          ...useEmojiStore().customEmoji,
        ],
        store: this.$store,
      })
    },
    emojiSuggestor() {
      return suggestor({
        emoji: [
          ...useEmojiStore().standardEmojiList,
          ...useEmojiStore().customEmoji,
        ],
      })
    },
    emoji() {
      return useEmojiStore().standardEmojiList
    },
    customEmoji() {
      return useEmojiStore().customEmoji
    },

    // Length & Limits
    statusLength() {
      return this.newStatusContent.length
    },
    spoilerTextLength() {
      return this.newStatus.spoilerText.length
    },
    statusLengthLimit() {
      return useInstanceStore().limits.textLimit
    },
    hasStatusLengthLimit() {
      return this.statusLengthLimit > 0
    },
    charactersLeft() {
      return (
        this.statusLengthLimit - (this.statusLength + this.spoilerTextLength)
      )
    },
    isOverLengthLimit() {
      return this.hasStatusLengthLimit && this.charactersLeft < 0
    },
    emptyStatus() {
      return (
        this.newStatus.status.trim() === '' && this.newStatus.files.length === 0
      )
    },
    uploadFileLimitReached() {
      return this.newStatus.files.length >= this.fileLimit
    },

    // Drafts
    shouldAutoSaveDraft() {
      return useMergedConfigStore().mergedConfig.autoSaveDraft
    },
    debouncedMaybeAutoSaveDraft() {
      return debounce(this.maybeAutoSaveDraft, 3000)
    },
    autoSaveState() {
      if (this.saveable) {
        return this.$t('post_status.auto_save_saving')
      } else if (this.newStatus.id) {
        return this.$t('post_status.auto_save_saved')
      } else {
        return this.$t('post_status.auto_save_nothing_new')
      }
    },
    safeToSaveDraft() {
      return (
        (this.newStatus.status ||
          this.newStatus.spoilerText ||
          this.newStatus.files.length ||
          this.hasPoll ||
          this.hasQuote) &&
        this.saveable
      )
    },
    hasEmptyDraft() {
      return (
        this.newStatus.id &&
        !(
          this.newStatus.status ||
          this.newStatus.spoilerText ||
          this.newStatus.files.length ||
          this.hasPoll ||
          this.hasQuote
        )
      )
    },

    // Error handling
    pollContentError() {
      return (
        this.pollFormVisible && this.newStatus.poll && this.newStatus.poll.error
      )
    },

    // Featureset detection
    postFormats() {
      return useInstanceCapabilitiesStore().postFormats || []
    },
    safeDMEnabled() {
      return useInstanceCapabilitiesStore().safeDM
    },
    pollsAvailable() {
      return (
        useInstanceCapabilitiesStore().pollsAvailable &&
        useInstanceStore().limits.pollLimits.max_options >= 2 &&
        this.disablePolls !== true
      )
    },
    hideExtraActions() {
      return this.disableDraft || this.hideDraft
    },
    quotingAvailable() {
      if (!useInstanceCapabilitiesStore().quotingAvailable) {
        return false
      }

      return this.disableQuotes !== true
    },

    // User configuration
    userDefaultScope() {
      return this.currentUser.default_scope
    },
    userDefaultPostContentType() {
      return this.mergedConfig.postContentType
    },
    userDefaultScopeCopy() {
      return this.mergedConfig.scopeCopy
    },
    userDefaultSensitive() {
      return this.mergedConfig.sensitiveByDefault
    },
    showAllScopes() {
      return !this.mergedConfig.minimalScopesMode
    },
    minimalScopesMode() {
      return this.mergedConfig.minimalScopesMode
    },
    alwaysShowSubject() {
      return this.mergedConfig.alwaysShowSubjectInput
    },
    hideScopeNotice() {
      return (
        this.disableNotice ||
        useMergedConfigStore().mergedConfig.hideScopeNotice
      )
    },

    // Global stuff
    currentUser() {
      return this.$store.state.users.currentUser
    },
    ...mapState(useMergedConfigStore, ['mergedConfig']),
    ...mapState(useInterfaceStore, {
      mobileLayout: (store) => store.mobileLayout,
    }),
  },
  watch: {
    newStatus: {
      deep: true,
      handler() {
        if (this.initialized) this.statusChanged()
      },
    },
    saveable(val) {
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
      // MDN says we'd better add the beforeunload event listener only when needed, and remove it when it's no longer needed
      if (val) {
        this.addBeforeUnloadListener()
      } else {
        this.removeBeforeUnloadListener()
      }
    },
  },
  beforeUnmount() {
    this.maybeAutoSaveDraft()
    this.removeBeforeUnloadListener()
  },
  methods: {
    ...mapActions(useMediaViewerStore, ['increment']),
    statusChanged() {
      this.autoPreview()
      this.updateIdempotencyKey()
      this.debouncedMaybeAutoSaveDraft()
      this.saveable = true
      this.saveInhibited = false
    },
    onMentionsLineUpdate(e) {
      if (this.mentionsLineReadOnly) return
      this.newStatus.mentionsLine = e
    },
    toggleQuoteForm() {
      if (!this.hasQuote) {
        this.newStatus.quote = {}
        this.newStatus.quote.thread = false
        this.newStatus.quote.id = null
        this.newStatus.quote.url = ''
      } else {
        this.newStatus.quote = null
      }
    },
    clearStatus() {
      const newStatus = this.newStatus
      this.saveInhibited = true
      this.newStatus.status = ''
      this.newStatus.mentionsLine = '',
      this.newStatus.spoilerText = '',
      this.newStatus.files = [],
      this.newStatus.poll = null,
      this.newStatus.quote = null,
      this.newStatus.mediaDescriptions = {},

      this.$refs.mediaUpload && this.$refs.mediaUpload.clearFile()
      this.clearQuoteForm()
      if (this.preserveFocus) {
        this.$nextTick(() => {
          this.$refs.textarea.focus()
        })
      }
      const el = this.$el.querySelector('textarea')
      el.style.height = 'auto'
      el.style.height = undefined
      this.error = null
      if (this.preview) this.previewStatus()
      this.saveable = false
    },
    async postStatus(event, newStatus) {
      if (this.posting && !this.optimisticPosting) {
        return
      }
      if (this.disableSubmit) {
        return
      }
      if (this.emojiInputShown) {
        return
      }
      if (this.submitOnEnter) {
        event.stopPropagation()
        event.preventDefault()
      }

      if (
        this.optimisticPosting &&
        (this.emptyStatus || this.isOverLengthLimit)
      ) {
        return
      }

      if (this.emptyStatus) {
        this.error = this.$t('post_status.empty_status_error')
        return
      }

      const poll = this.hasPoll ? pollFormToMasto(newStatus.poll) : {}
      if (this.pollContentError) {
        this.error = this.pollContentError
        return
      }

      this.posting = true

      try {
        await this.setAllMediaDescriptions()
      } catch {
        this.error = this.$t('post_status.media_description_error')
        this.posting = false
        return
      }

      const postingOptions = {
        status: this.newStatusContent,
        spoilerText: newStatus.spoilerText || null,
        visibility: newStatus.visibility,
        sensitive: newStatus.nsfw,
        media: newStatus.files,
        store: this.$store,
        inReplyToStatusId: this.inReplyStatusId,
        quoteId: this.quoteId,
        contentType: newStatus.contentType,
        poll,
        idempotencyKey: this.idempotencyKey,
      }

      const postHandler = this.postHandler
        ? this.postHandler
        : statusPoster.postStatus

      postHandler(postingOptions)
        .then((data) => {
          this.abandonDraft()
          this.clearStatus()
          this.$emit('posted', data)
        })
        .catch((error) => {
          this.error = error
        })
        .finally(() => {
          this.posting = false
        })
    },
    previewStatus() {
      if (this.emptyStatus && this.newStatus.spoilerText.trim() === '') {
        this.preview = { error: this.$t('post_status.preview_empty') }
        this.previewLoading = false
        return
      }
      const newStatus = this.newStatus
      this.previewLoading = true

      statusPoster
        .postStatus({
          status: this.newStatusContent,
          spoilerText: newStatus.spoilerText || null,
          visibility: newStatus.visibility,
          sensitive: newStatus.nsfw,
          media: [],
          store: this.$store,
          inReplyToStatusId: this.inReplyStatusId,
          quoteId: this.quoteId,
          contentType: newStatus.contentType,
          poll: {},
          preview: true,
        })
        .then((data) => {
          // Don't apply preview if not loading, because it means
          // user has closed the preview manually.
          if (!this.previewLoading) return
          this.preview = data
        })
        .catch((error) => {
          this.preview = { error }
        })
        .finally(() => {
          this.previewLoading = false
        })
    },
    debouncePreviewStatus: debounce(function () {
      this.previewStatus()
    }, 500),
    autoPreview() {
      if (!this.preview) return
      this.previewLoading = true
      this.debouncePreviewStatus()
    },
    closePreview() {
      this.preview = null
      this.previewLoading = false
    },
    togglePreview() {
      if (this.showPreview) {
        this.closePreview()
      } else {
        this.previewStatus()
      }
    },
    addMediaFile(fileInfo) {
      this.newStatus.files.push(fileInfo)
      this.$emit('resize', { delayed: true })
    },
    removeMediaFile(fileInfo) {
      const index = this.newStatus.files.indexOf(fileInfo)
      this.newStatus.files.splice(index, 1)
      this.$emit('resize')
    },
    editAttachment(fileInfo, newText) {
      this.newStatus.mediaDescriptions[fileInfo.id] = newText
    },
    shiftUpMediaFile(fileInfo) {
      const { files } = this.newStatus
      const index = this.newStatus.files.indexOf(fileInfo)
      files.splice(index, 1)
      files.splice(index - 1, 0, fileInfo)
    },
    shiftDnMediaFile(fileInfo) {
      const { files } = this.newStatus
      const index = this.newStatus.files.indexOf(fileInfo)
      files.splice(index, 1)
      files.splice(index + 1, 0, fileInfo)
    },
    uploadFailed(errString, templateArgs) {
      templateArgs = templateArgs || {}
      this.error =
        this.$t('upload.error.base') +
        ' ' +
        this.$t('upload.error.' + errString, templateArgs)
    },
    startedUploadingFiles() {
      this.uploadingFiles = true
    },
    finishedUploadingFiles() {
      this.$emit('resize')
      this.uploadingFiles = false
    },
    paste(e) {
      this.autoPreview()
      this.resize(e)
      if (e.clipboardData.files.length > 0) {
        // prevent pasting of file as text
        e.preventDefault()
        // Strangely, files property gets emptied after event propagation
        // Trying to wrap it in array doesn't work. Plus I doubt it's possible
        // to hold more than one file in clipboard.
        this.dropFiles = [e.clipboardData.files[0]]
      }
    },
    fileDrop(e) {
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        e.preventDefault() // allow dropping text like before
        this.dropFiles = e.dataTransfer.files
        clearTimeout(this.dropStopTimeout)
        this.showDropIcon = 'hide'
      }
    },
    fileDragStop() {
      // The false-setting is done with delay because just using leave-events
      // directly caused unwanted flickering, this is not perfect either but
      // much less noticable.
      clearTimeout(this.dropStopTimeout)
      this.showDropIcon = 'fade'
      this.dropStopTimeout = setTimeout(() => (this.showDropIcon = 'hide'), 500)
    },
    fileDrag(e) {
      e.dataTransfer.dropEffect = this.uploadFileLimitReached ? 'none' : 'copy'
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        clearTimeout(this.dropStopTimeout)
        this.showDropIcon = 'show'
      }
    },
    onEmojiInputInput() {
      this.$nextTick(() => {
        this.resize(this.$refs.textarea)
      })
    },
    resize(e) {
      const target = e.target || e
      if (!(target instanceof window.Element)) {
        return
      }

      // Reset to default height for empty form, nothing else to do here.
      if (target.value === '') {
        target.style.height = null
        this.$emit('resize')
        return
      }

      const formRef = this.$refs.form
      const bottomRef = this.$refs.bottom
      /* Scroller is either `window` (replies in TL), sidebar (main post form,
       * replies in notifs) or mobile post form. Note that getting and setting
       * scroll is different for `Window` and `Element`s
       */
      const bottomBottomPaddingStr =
        window.getComputedStyle(bottomRef)['padding-bottom']
      const bottomBottomPadding = pxStringToNumber(bottomBottomPaddingStr)

      const scrollerRef =
        this.$el.closest('.column.-scrollable') ||
        this.$el.closest('.post-form-modal-view') ||
        window

      // Getting info about padding we have to account for, removing 'px' part
      const topPaddingStr = window.getComputedStyle(target)['padding-top']
      const bottomPaddingStr = window.getComputedStyle(target)['padding-bottom']
      const topPadding = pxStringToNumber(topPaddingStr)
      const bottomPadding = pxStringToNumber(bottomPaddingStr)
      const vertPadding = topPadding + bottomPadding

      const oldHeight = pxStringToNumber(target.style.height)

      /* Explanation:
       *
       * https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
       * scrollHeight returns element's scrollable content height, i.e. visible
       * element + overscrolled parts of it. We use it to determine when text
       * inside the textarea exceeded its height, so we can set height to prevent
       * overscroll, i.e. make textarea grow with the text. HOWEVER, since we
       * explicitly set new height, scrollHeight won't go below that, so we can't
       * SHRINK the textarea when there's extra space. To workaround that we set
       * height to 'auto' which makes textarea tiny again, so that scrollHeight
       * will match text height again. HOWEVER, shrinking textarea can screw with
       * the scroll since there might be not enough padding around form-bottom to even
       * warrant a scroll, so it will jump to 0 and refuse to move anywhere,
       * so we check current scroll position before shrinking and then restore it
       * with needed delta.
       */

      // this part has to be BEFORE the content size update
      const currentScroll =
        scrollerRef === window ? scrollerRef.scrollY : scrollerRef.scrollTop
      const scrollerHeight =
        scrollerRef === window
          ? scrollerRef.innerHeight
          : scrollerRef.offsetHeight
      const scrollerBottomBorder = currentScroll + scrollerHeight

      // BEGIN content size update
      target.style.height = 'auto'
      const heightWithoutPadding = Math.floor(target.scrollHeight - vertPadding)
      let newHeight = this.maxHeight
        ? Math.min(heightWithoutPadding, this.maxHeight)
        : heightWithoutPadding
      // This is a bit of a hack to combat target.scrollHeight being different on every other input
      // on some browsers for whatever reason. Don't change the height if difference is 1px or less.
      if (Math.abs(newHeight - oldHeight) <= 1) {
        newHeight = oldHeight
      }
      target.style.height = `${newHeight}px`
      this.$emit('resize', newHeight)
      // END content size update

      // We check where the bottom border of form-bottom element is, this uses findOffset
      // to find offset relative to scrollable container (scroller)
      const bottomBottomBorder =
        bottomRef.offsetHeight +
        findOffset(bottomRef, scrollerRef).top +
        bottomBottomPadding

      const isBottomObstructed = scrollerBottomBorder < bottomBottomBorder
      const isFormBiggerThanScroller = scrollerHeight < formRef.offsetHeight
      const bottomChangeDelta = bottomBottomBorder - scrollerBottomBorder
      // The intention is basically this;
      // Keep form-bottom always visible so that submit button is in view EXCEPT
      // if form element bigger than scroller and caret isn't at the end, so that
      // if you scroll up and edit middle of text you won't get scrolled back to bottom
      const shouldScrollToBottom =
        isBottomObstructed &&
        !(
          isFormBiggerThanScroller &&
          this.$refs.textarea.selectionStart !==
            this.$refs.textarea.value.length
        )
      const totalDelta = shouldScrollToBottom ? bottomChangeDelta : 0
      const targetScroll = Math.round(currentScroll + totalDelta)

      if (scrollerRef === window) {
        scrollerRef.scroll(0, targetScroll)
      } else {
        scrollerRef.scrollTop = targetScroll
      }
    },
    clearError() {
      this.error = null
    },
    changeVis(visibility) {
      this.newStatus.visibility = visibility
    },
    togglePollForm() {
      this.newStatus.poll = this.hasPoll ? null : {}
    },
    setPoll(poll) {
      this.newStatus.poll = poll
    },
    clearQuoteForm() {
      if (this.$refs.quoteForm) {
        this.$refs.quoteForm.clear()
      }
    },
    dismissScopeNotice() {
      useSyncConfigStore().setSimplePrefAndSave({
        path: 'hideScopeNotice',
        value: true,
      })
    },
    setMediaDescription(id) {
      const description = this.newStatus.mediaDescriptions[id]
      if (!description || description.trim() === '') return
      return statusPoster.setMediaDescription({
        store: this.$store,
        id,
        description,
      })
    },
    setAllMediaDescriptions() {
      const ids = this.newStatus.files.map((file) => file.id)
      return Promise.all(ids.map((id) => this.setMediaDescription(id)))
    },
    handleEmojiInputShow(value) {
      this.emojiInputShown = value
    },
    updateIdempotencyKey() {
      this.idempotencyKey = Date.now().toString()
    },
    openProfileTab() {
      useInterfaceStore().openSettingsModalTab('profile')
    },
    propsToNative(props) {
      return propsToNative(props)
    },
    saveDraft() {
      if (!this.disableDraft && !this.saveInhibited) {
        if (this.safeToSaveDraft) {
          return this.$store
            .dispatch('addOrSaveDraft', { draft: this.newStatus })
            .then((id) => {
              if (this.newStatus.id !== id) {
                this.newStatus.id = id
              }
              this.saveable = false
              if (!this.shouldAutoSaveDraft) {
                this.clearStatus()
                this.$emit('draft-done')
              }
            })
        } else if (this.hasEmptyDraft) {
          // There is a draft, but there is nothing in it, clear it
          return this.abandonDraft().then(() => {
            this.saveable = false
            if (!this.shouldAutoSaveDraft) {
              this.clearStatus()
              this.$emit('draft-done')
            }
          })
        }
      }
      return Promise.resolve()
    },
    maybeAutoSaveDraft() {
      if (this.shouldAutoSaveDraft) {
        this.saveDraft(false)
      }
    },
    abandonDraft() {
      return this.$store.dispatch('abandonDraft', { id: this.newStatus.id })
    },
    getDraft() {
      const maybeDraft = this.$store.state.drafts.drafts[this.draftId]
      if (this.draftId && maybeDraft) {
        return maybeDraft
      } else {
        const existingDrafts = this.$store.getters.draftsByTypeAndRefId(
          this.statusType,
          this.refId,
        )

        if (existingDrafts.length) {
          return existingDrafts[0]
        }
      }
      // No draft available, fall back
    },
    requestClose() {
      if (!this.saveable) {
        this.$emit('close-accepted')
      } else {
        this.$refs.draftCloser.requestClose()
      }
    },
    saveAndCloseDraft() {
      this.saveDraft().then(() => {
        this.$emit('close-accepted')
      })
    },
    discardAndCloseDraft() {
      this.abandonDraft().then(() => {
        this.$emit('close-accepted')
      })
    },
    addBeforeUnloadListener() {
      this._beforeUnloadListener ||= () => {
        this.saveDraft()
      }
      window.addEventListener('beforeunload', this._beforeUnloadListener)
    },
    removeBeforeUnloadListener() {
      if (this._beforeUnloadListener) {
        window.removeEventListener('beforeunload', this._beforeUnloadListener)
      }
    },
  },
}

export default PostStatusForm
