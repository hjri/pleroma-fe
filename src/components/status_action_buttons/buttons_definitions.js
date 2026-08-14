import { useEditStatusStore } from 'src/stores/editStatus.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useReportsStore } from 'src/stores/reports.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStatusHistoryStore } from 'src/stores/statusHistory.js'

const PRIVATE_SCOPES = new Set(['private', 'direct'])
const PUBLIC_SCOPES = new Set(['public', 'unlisted'])
export const BUTTONS = [
  {
    // =========
    // REPLY
    // =========
    name: 'reply',
    label: 'tool_tip.reply',
    icon: 'reply',
    active: ({ replying }) => replying,
    counter: ({ status }) => status.replies_count,
    anon: true,
    anonLink: true,
    toggleable: true,
    closeIndicator: 'times',
    activeIndicator: null,
    action({ emit }) {
      emit('toggleReplying')
      return Promise.resolve()
    },
  },
  {
    // =========
    // REPEAT
    // =========
    name: 'retweet',
    label: ({ status }) =>
      status.repeated ? 'tool_tip.unrepeat' : 'tool_tip.repeat',
    icon({ status, loggedIn, currentUser }) {
      if (
        loggedIn &&
        status.user.id !== currentUser.id &&
        PRIVATE_SCOPES.has(status.visibility)
      ) {
        return 'lock'
      }
      return 'retweet'
    },
    animated: true,
    active: ({ status }) => status.repeated,
    counter: ({ status }) => status.repeat_num,
    anonLink: true,
    interactive: ({ status, currentUser }) =>
      !!currentUser &&
      (currentUser.id === status.user.id ||
        !PRIVATE_SCOPES.has(status.visibility)),
    toggleable: true,
    confirm: ({ status }) =>
      !status.repeated && useMergedConfigStore().mergedConfig.modalOnRepeat,
    confirmStrings: {
      title: 'status.repeat_confirm_title',
      body: 'status.repeat_confirm',
      confirm: 'status.repeat_confirm_accept_button',
      cancel: 'status.repeat_confirm_cancel_button',
    },
    action({ status }) {
      if (!status.repeated) {
        return useStatusesStore().retweet(status.id)
      } else {
        return useStatusesStore().unretweet(status.id)
      }
    },
  },
  {
    // =========
    // FAVORITE
    // =========
    name: 'favorite',
    label: ({ status }) =>
      status.favorited ? 'tool_tip.unfavorite' : 'tool_tip.favorite',
    icon: ({ status }) =>
      status.favorited ? ['fas', 'star'] : ['far', 'star'],
    animated: true,
    active: ({ status }) => status.favorited,
    counter: ({ status }) => status.fave_num,
    anonLink: true,
    toggleable: true,
    action({ status }) {
      if (!status.favorited) {
        return useStatusesStore().favorite(status.id)
      } else {
        return useStatusesStore().unfavorite(status.id)
      }
    },
  },
  {
    // =========
    // EMOJI REACTIONS
    // =========
    name: 'emoji',
    label: 'tool_tip.add_reaction',
    icon: ['far', 'face-smile-beam'],
    interactive: () => true,
    active: ({ emojiPickerShown }) => emojiPickerShown,
    toggleable: true,
    anonLink: true,
  },
  {
    // =========
    // MUTE
    // =========
    name: 'mute',
    icon: 'eye-slash',
    label: 'status.mute_ellipsis',
    if: ({ loggedIn }) => loggedIn,
    toggleable: false,
    dropdown: true,
    action({ status, emit }) {
      /* prevent hiding */
    },
  },
  {
    // =========
    // PIN STATUS
    // =========
    name: 'pin',
    icon: 'thumbtack',
    label: ({ status }) => (status.pinned ? 'status.unpin' : 'status.pin'),
    if({ status, loggedIn, currentUser }) {
      return (
        loggedIn &&
        status.user.id === currentUser.id &&
        PUBLIC_SCOPES.has(status.visibility)
      )
    },
    action({ status }) {
      if (status.pinned) {
        return useStatusesStore().unpinStatus(status.id)
      } else {
        return useStatusesStore().pinStatus(status.id)
      }
    },
  },
  {
    // =========
    // BOOKMARK
    // =========
    name: 'bookmark',
    icon: ({ status }) =>
      status.bookmarked ? ['fas', 'bookmark'] : ['far', 'bookmark'],
    toggleable: true,
    active: ({ status }) => status.bookmarked,
    label: ({ status }) =>
      status.bookmarked ? 'status.unbookmark' : 'status.bookmark',
    if: ({ loggedIn }) => loggedIn,
    action({ status }) {
      if (status.bookmarked) {
        return useStatusesStore().unbookmark(status.id)
      } else {
        return useStatusesStore().bookmark(status.id)
      }
    },
  },
  {
    // =========
    // EDIT HISTORY
    // =========
    name: 'editHistory',
    icon: 'history',
    label: 'status.status_history',
    if({ status }) {
      return (
        useInstanceCapabilitiesStore().editingAvailable &&
        status.edited_at !== null
      )
    },
    action({ status }) {
      const originalStatus = { ...status }
      const stripFieldsList = [
        'attachments',
        'created_at',
        'emojis',
        'text',
        'raw_html',
        'nsfw',
        'poll',
        'summary',
        'summary_raw_html',
      ]
      stripFieldsList.forEach((p) => delete originalStatus[p])
      useStatusHistoryStore().openStatusHistoryModal(originalStatus)
      return Promise.resolve()
    },
  },
  {
    // =========
    // EDIT
    // =========
    name: 'edit',
    icon: 'pen',
    label: 'status.edit',
    if({ status, loggedIn, currentUser }) {
      return (
        loggedIn &&
        useInstanceCapabilitiesStore().editingAvailable &&
        status.user.id === currentUser.id
      )
    },
    action({ status }) {
      return useStatusesStore()
        .fetchStatusSource(status.id)
        .then((data) =>
          useEditStatusStore().openEditStatusModal({
            statusId: status.id,
            statusSubject: data.spoiler_text,
            statusText: data.text,
            statusIsSensitive: status.nsfw,
            statusPoll: status.poll,
            statusFiles: [...status.attachments],
            statusVisibility: status.visibility,
            statusContentType: data.content_type,
          }),
        )
    },
  },
  {
    // =========
    // OPEN IN CHAT VIEW
    // =========
    name: 'chat_view',
    icon: 'comments',
    label: 'status.open_in_chat_view',
    if({ chatView }) {
      return !chatView
    },
    action({ router, status }) {
      router.push({ name: 'conversation2', params: { statusId: status.id } })
    },
  },
  {
    // =========
    // OPEN IN THREAD VIEW
    // =========
    name: 'thread_view',
    icon: 'list',
    label: 'status.open_in_thread_view',
    if({ chatView }) {
      return chatView
    },
    action({ router, status }) {
      router.push({ name: 'conversation', params: { id: status.id } })
    },
  },
  {
    // =========
    // DELETE
    // =========
    name: 'delete',
    icon: 'times',
    label: 'status.delete',
    if({ status, loggedIn, currentUser }) {
      return (
        loggedIn &&
        (status.user.id === currentUser.id ||
          currentUser.privileges.has('messages_delete'))
      )
    },
    confirm: () => useMergedConfigStore().mergedConfig.modalOnDelete,
    confirmStrings: {
      title: 'status.delete_confirm_title',
      body: 'status.delete_confirm',
      confirm: 'status.delete_confirm_accept_button',
      cancel: 'status.delete_confirm_cancel_button',
    },
    action({ status }) {
      return useStatusesStore().deleteStatus(status.id)
    },
  },
  {
    // =========
    // CHANGE SCOPE
    // =========
    name: 'changeScope',
    icon: 'eye',
    label: 'status.admin_change_scope',
    if({ status, loggedIn, currentUser }) {
      return (
        loggedIn &&
        (status.user.id === currentUser.id ||
          currentUser.privileges.has('messages_delete'))
      )
    },
    toggleable: false,
    dropdown: true,
    action({ status, emit }) {
      /* prevent hiding */
    },
  },
  {
    // =========
    // SHARE/COPY
    // =========
    name: 'share',
    icon: 'share-alt',
    label: 'status.copy_link',
    action({ status, router }) {
      navigator.clipboard.writeText(
        [
          useInstanceStore().server,
          router.resolve({ name: 'conversation', params: { id: status.id } })
            .href,
        ].join(''),
      )
      return Promise.resolve()
    },
  },
  {
    // =========
    // EXTERNAL
    // =========
    name: 'external',
    icon: 'external-link-alt',
    label: 'status.external_source',
    link: ({ status }) => status.external_url,
  },
  {
    // =========
    // REPORT
    // =========
    name: 'report',
    icon: 'flag',
    label: 'user_card.report',
    if: ({ loggedIn }) => loggedIn,
    action({ status }) {
      useReportsStore().openUserReportingModal({
        userId: status.user.id,
        statusIds: [status.id],
      })

      return Promise.resolve()
    },
  },
].map((button) => {
  return Object.fromEntries(
    Object.entries(button).map(([k, v]) => [
      k,
      typeof v === 'function' || k === 'name' ? v : () => v,
    ]),
  )
})
