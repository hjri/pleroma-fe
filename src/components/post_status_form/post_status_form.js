import { debounce, map, reject, uniqBy } from 'lodash'
import { mapActions, mapState } from 'pinia'
import { mapGetters } from 'vuex'

import DraftCloser from 'src/components/draft_closer/draft_closer.vue'
import Gallery from 'src/components/gallery/gallery.vue'
import Popover from 'src/components/popover/popover.vue'
import { propsToNative } from '../../services/attributes_helper/attributes_helper.service.js'
import { findOffset } from '../../services/offset_finder/offset_finder.service.js'
import genRandomSeed from '../../services/random_seed/random_seed.service.js'
import statusPoster from '../../services/status_poster/status_poster.service.js'
import Attachment from '../attachment/attachment.vue'
import Checkbox from '../checkbox/checkbox.vue'
import EmojiInput from '../emoji_input/emoji_input.vue'
import suggestor from '../emoji_input/suggestor.js'
import MediaUpload from '../media_upload/media_upload.vue'
import PollForm from '../poll/poll_form.vue'
import QuoteForm from '../quote/quote_form.vue'
import ScopeSelector from '../scope_selector/scope_selector.vue'
import Select from '../select/select.vue'
import StatusContent from '../status_content/status_content.vue'

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

const buildMentionsString = ({ user, attentions = [] }, currentUser) => {
  let allAttentions = [...attentions]

  allAttentions.unshift(user)

  allAttentions = uniqBy(allAttentions, 'id')
  allAttentions = reject(allAttentions, { id: currentUser.id })

  const mentions = map(allAttentions, (attention) => {
    return `@${attention.screen_name}`
  })

  return mentions.length > 0 ? mentions.join(' ') + ' ' : ''
}

// Converts a string with px to a number like '2px' -> 2
const pxStringToNumber = (str) => {
  return Number(str.substring(0, str.length - 2))
}

const typeAndRefId = ({ replyTo, profileMention, statusId }) => {
  if (replyTo) {
    return ['reply', replyTo]
  } else if (profileMention) {
    return ['mention', profileMention]
  } else if (statusId) {
    return ['edit', statusId]
  } else {
    return ['new', '']
  }
}

const PostStatusForm = {
  props: [
    'statusId',
    'statusText',
    'statusIsSensitive',
    'statusPoll',
    'statusFiles',
    'statusMediaDescriptions',
    'statusScope',
    'statusContentType',
    'replyTo',
    'repliedUser',
    'attentions',
    'copyMessageScope',
    'subject',
    'disableSubject',
    'disableScopeSelector',
    'disableVisibilitySelector',
    'disableNotice',
    'disableLockWarning',
    'disablePolls',
    'disableQuotes',
    'disableSensitivityCheckbox',
    'disableSubmit',
    'disablePreview',
    'disableDraft',
    'hideDraft',
    'closeable',
    'placeholder',
    'maxHeight',
    'postHandler',
    'preserveFocus',
    'autoFocus',
    'fileLimit',
    'submitOnEnter',
    'emojiPickerPlacement',
    'optimisticPosting',
    'profileMention',
    'draftId',
  ],
  emits: [
    'posted',
    'draft-done',
    'resize',
    'mediaplay',
    'mediapause',
    'can-close',
    'update',
  ],
  components: {
    MediaUpload,
    EmojiInput,
    PollForm,
    QuoteForm,
    ScopeSelector,
    Checkbox,
    Select,
    Attachment,
    StatusContent,
    Gallery,
    DraftCloser,
    Popover,
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
  data() {
    const preset = this.$route.query.message
    let statusText = preset || ''

    const { scopeCopy } = useMergedConfigStore().mergedConfig

    const [statusType, refId] = typeAndRefId({
      replyTo: this.replyTo,
      profileMention: this.profileMention && this.repliedUser?.id,
      statusId: this.statusId,
    })

    // If we are starting a new post, do not associate it with old drafts
    let statusParams =
      !this.disableDraft && (this.draftId || statusType !== 'new')
        ? this.getDraft(statusType, refId)
        : null

    if (!statusParams) {
      if (statusType === 'reply' || statusType === 'mention') {
        const currentUser = this.$store.state.users.currentUser
        statusText = buildMentionsString(
          { user: this.repliedUser, attentions: this.attentions },
          currentUser,
        )
      }

      const scope =
        (this.copyMessageScope && scopeCopy) ||
        this.copyMessageScope === 'direct'
          ? this.copyMessageScope
          : this.$store.state.users.currentUser.default_scope

      const { postContentType: contentType, sensitiveByDefault } =
        useMergedConfigStore().mergedConfig

      statusParams = {
        type: statusType,
        refId,
        spoilerText: this.subject || '',
        status: statusText,
        nsfw: !!sensitiveByDefault,
        files: [],
        poll: {},
        hasPoll: false,
        hasQuote: false,
        quote: {},
        mediaDescriptions: {},
        visibility: scope,
        contentType,
        quoting: false,
      }

      if (statusType === 'edit') {
        const statusContentType = this.statusContentType || contentType
        statusParams = {
          type: statusType,
          refId,
          spoilerText: this.subject || '',
          status: this.statusText || '',
          nsfw: this.statusIsSensitive || !!sensitiveByDefault,
          files: this.statusFiles || [],
          poll: this.statusPoll || {},
          hasPoll: false,
          hasQuote: false,
          quote: {},
          mediaDescriptions: this.statusMediaDescriptions || {},
          visibility: this.statusScope || scope,
          contentType: statusContentType,
        }
      }
    }

    return {
      randomSeed: genRandomSeed(),
      dropFiles: [],
      uploadingFiles: false,
      error: null,
      posting: false,
      highlighted: 0,
      newStatus: statusParams,
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
  computed: {
    users() {
      return this.$store.state.users.users
    },
    userDefaultScope() {
      return this.$store.state.users.currentUser.default_scope
    },
    showAllScopes() {
      return !this.mergedConfig.minimalScopesMode
    },
    hideExtraActions() {
      return this.disableDraft || this.hideDraft
    },
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
    statusLength() {
      return this.newStatus.status.length
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
    minimalScopesMode() {
      return useInstanceStore().minimalScopesMode
    },
    alwaysShowSubject() {
      return this.mergedConfig.alwaysShowSubjectInput
    },
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
    hideScopeNotice() {
      return (
        this.disableNotice ||
        useMergedConfigStore().mergedConfig.hideScopeNotice
      )
    },
    pollContentError() {
      return (
        this.pollFormVisible && this.newStatus.poll && this.newStatus.poll.error
      )
    },
    showPreview() {
      return !this.disablePreview && (!!this.preview || this.previewLoading)
    },
    emptyStatus() {
      return (
        this.newStatus.status.trim() === '' && this.newStatus.files.length === 0
      )
    },
    uploadFileLimitReached() {
      return this.newStatus.files.length >= this.fileLimit
    },
    isEdit() {
      return typeof this.statusId !== 'undefined' && this.statusId.trim() !== ''
    },
    quotingAvailable() {
      if (!useInstanceCapabilitiesStore().quotingAvailable) {
        return false
      }

      return this.disableQuotes !== true
    },
    isReply() {
      return this.newStatus.type === 'reply'
    },
    quotable() {
      return this.quotingAvailable && this.replyTo
    },
    quoteThreadToggled: {
      get() {
        return this.newStatus.hasQuote && this.newStatus.quote.thread
      },
      set(value) {
        this.newStatus.hasQuote = value
        this.newStatus.quote.thread = value
        this.newStatus.quote.id = value ? this.replyTo : ''
      }
    },
    defaultQuotable() {
      if (
        !this.quotingAvailable ||
        !this.isReply
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
        return repliedStatus.user.id === this.$store.state.users.currentUser.id
      }

      return false
    },
    inReplyStatusId() {
      return !this.newStatus.hasQuote ||
        !this.newStatus.quote.thread ||
        !this.newStatus.quote.id
        ? this.replyTo
        : undefined
    },
    quoteId() {
      return this.newStatus.hasQuote ? this.newStatus.quote.id : undefined
    },
    debouncedMaybeAutoSaveDraft() {
      return debounce(this.maybeAutoSaveDraft, 3000)
    },
    pollFormVisible() {
      return this.newStatus.hasPoll
    },
    quoteFormVisible() {
      return this.newStatus.hasQuote && !this.newStatus.quote.thread
    },
    shouldAutoSaveDraft() {
      return useMergedConfigStore().mergedConfig.autoSaveDraft
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
          this.newStatus.files?.length ||
          this.newStatus.hasPoll ||
          this.newStatus.hasQuote) &&
        this.saveable
      )
    },
    hasEmptyDraft() {
      return (
        this.newStatus.id &&
        !(
          this.newStatus.status ||
          this.newStatus.spoilerText ||
          this.newStatus.files?.length ||
          this.newStatus.hasPoll ||
          this.newStatus.hasQuote
        )
      )
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
        this.statusChanged()
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
    clearStatus() {
      const newStatus = this.newStatus
      this.saveInhibited = true
      this.newStatus = {
        status: '',
        spoilerText: '',
        files: [],
        visibility: newStatus.visibility,
        contentType: newStatus.contentType,
        poll: {},
        hasPoll: false,
        hasQuote: false,
        quote: {},
        mediaDescriptions: {},
      }
      this.$refs.mediaUpload && this.$refs.mediaUpload.clearFile()
      this.clearPollForm()
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

      const poll = newStatus.hasPoll ? pollFormToMasto(newStatus.poll) : {}
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
        status: newStatus.status,
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

      postHandler(postingOptions).then((data) => {
        if (!data.error) {
          this.abandonDraft()
          this.clearStatus()
          this.$emit('posted', data)
        } else {
          this.error = data.error
        }
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
          status: newStatus.status,
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
          if (!data.error) {
            this.preview = data
          } else {
            this.preview = { error: data.error }
          }
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
      this.newStatus.hasPoll = !this.newStatus.hasPoll
    },
    setPoll(poll) {
      this.newStatus.poll = poll
    },
    clearPollForm() {
      if (this.$refs.pollForm) {
        this.$refs.pollForm.clear()
      }
    },
    clearQuoteForm() {
      if (this.$refs.quoteForm) {
        this.$refs.quoteForm.clear()
      }
    },
    toggleQuoteForm() {
      this.newStatus.hasQuote = !this.newStatus.hasQuote

      this.newStatus.quote = {}
      this.newStatus.quote.thread = false
      this.newStatus.quote.id = null
      this.newStatus.quote.url = ''
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
    getDraft(statusType, refId) {
      const maybeDraft = this.$store.state.drafts.drafts[this.draftId]
      if (this.draftId && maybeDraft) {
        return maybeDraft
      } else {
        const existingDrafts = this.$store.getters.draftsByTypeAndRefId(
          statusType,
          refId,
        )

        if (existingDrafts.length) {
          return existingDrafts[0]
        }
      }
      // No draft available, fall back
    },
    requestClose() {
      if (!this.saveable) {
        this.$emit('can-close')
      } else {
        this.$refs.draftCloser.requestClose()
      }
    },
    saveAndCloseDraft() {
      this.saveDraft().then(() => {
        this.$emit('can-close')
      })
    },
    discardAndCloseDraft() {
      this.abandonDraft().then(() => {
        this.$emit('can-close')
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
