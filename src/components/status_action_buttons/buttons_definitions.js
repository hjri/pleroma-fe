import { useEditStatusStore } from 'src/stores/editStatus.js'
import { useReportsStore } from 'src/stores/reports.js'
import { useStatusHistoryStore } from 'src/stores/statusHistory.js'

const PRIVATE_SCOPES = new Set(['private', 'direct'])
const PUBLIC_SCOPES = new Set(['public', 'unlisted'])
export const BUTTONS = [{
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
  activeIndicator: 'none',
  action ({ emit }) {
    emit('toggleReplying')
    return Promise.resolve()
  }
}, {
  // =========
  // REPEAT
  // =========
  name: 'retweet',
  label: ({ status }) => status.repeated
    ? 'tool_tip.unrepeat'
    : 'tool_tip.repeat',
  icon ({ status, currentUser }) {
    if (currentUser.id !== status.user.id && PRIVATE_SCOPES.has(status.visibility)) {
      return 'lock'
    }
    return 'retweet'
  },
  animated: true,
  active: ({ status }) => status.repeated,
  counter: ({ status }) => status.repeat_num,
  anonLink: true,
  interactive: ({ status, currentUser }) => !!currentUser && (currentUser.id === status.user.id || !PRIVATE_SCOPES.has(status.visibility)),
  toggleable: true,
  confirm: ({ status, getters }) => !status.repeated && getters.mergedConfig.modalOnRepeat,
  confirmStrings: {
    title: 'status.repeat_confirm_title',
    body: 'status.repeat_confirm',
    confirm: 'status.repeat_confirm_accept_button',
    cancel: 'status.repeat_confirm_cancel_button'
  },
  action ({ status, dispatch }) {
    if (!status.repeated) {
      return dispatch('retweet', { id: status.id })
    } else {
      return dispatch('unretweet', { id: status.id })
    }
  }
}, {
  // =========
  // FAVORITE
  // =========
  name: 'favorite',
  label: ({ status }) => status.favorited
    ? 'tool_tip.unfavorite'
    : 'tool_tip.favorite',
  icon: ({ status }) => status.favorited
    ? ['fas', 'star']
    : ['far', 'star'],
  animated: true,
  active: ({ status }) => status.favorited,
  counter: ({ status }) => status.fave_num,
  anonLink: true,
  toggleable: true,
  action ({ status, dispatch }) {
    if (!status.favorited) {
      return dispatch('favorite', { id: status.id })
    } else {
      return dispatch('unfavorite', { id: status.id })
    }
  }
}, {
  // =========
  // EMOJI REACTIONS
  // =========
  name: 'emoji',
  label: 'tool_tip.add_reaction',
  icon: ['far', 'smile-beam'],
  anonLink: true
}, {
  // =========
  // MUTE
  // =========
  name: 'mute',
  icon: 'eye-slash',
  label: 'status.mute_ellipsis',
  if: ({ loggedIn }) => loggedIn,
  toggleable: true,
  dropdown: true
  // action ({ status, dispatch, emit }) {
  // }
}, {
  // =========
  // PIN STATUS
  // =========
  name: 'pin',
  icon: 'thumbtack',
  label: ({ status }) => status.pinned
    ? 'status.unpin'
    : 'status.pin',
  if ({ status, loggedIn, currentUser }) {
    return loggedIn &&
      status.user.id === currentUser.id &&
      PUBLIC_SCOPES.has(status.visibility)
  },
  action ({ status, dispatch }) {
    if (status.pinned) {
      return dispatch('unpinStatus', status.id)
    } else {
      return dispatch('pinStatus', status.id)
    }
  }
}, {
  // =========
  // BOOKMARK
  // =========
  name: 'bookmark',
  icon: ({ status }) => status.bookmarked
    ? ['fas', 'bookmark']
    : ['far', 'bookmark'],
  toggleable: true,
  active: ({ status }) => status.bookmarked,
  label: ({ status }) => status.bookmarked
    ? 'status.unbookmark'
    : 'status.bookmark',
  if: ({ loggedIn }) => loggedIn,
  action ({ status, dispatch }) {
    if (status.bookmarked) {
      return dispatch('unbookmark', { id: status.id })
    } else {
      return dispatch('bookmark', { id: status.id })
    }
  }
}, {
  // =========
  // EDIT HISTORY
  // =========
  name: 'editHistory',
  icon: 'history',
  label: 'status.status_history',
  if ({ status, state }) {
    return state.instance.editingAvailable &&
      status.edited_at !== null
  },
  action ({ status }) {
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
      'summary_raw_html'
    ]
    stripFieldsList.forEach(p => delete originalStatus[p])
    useStatusHistoryStore().openStatusHistoryModal(originalStatus)
    return Promise.resolve()
  }
}, {
  // =========
  // EDIT
  // =========
  name: 'edit',
  icon: 'pen',
  label: 'status.edit',
  if ({ status, loggedIn, currentUser, state }) {
    return loggedIn &&
      state.instance.editingAvailable &&
      status.user.id === currentUser.id
  },
  action ({ dispatch, status }) {
    return dispatch('fetchStatusSource', { id: status.id })
      .then(data => useEditStatusStore().openEditStatusModal({
        statusId: status.id,
        subject: data.spoiler_text,
        statusText: data.text,
        statusIsSensitive: status.nsfw,
        statusPoll: status.poll,
        statusFiles: [...status.attachments],
        visibility: status.visibility,
        statusContentType: data.content_type
      }))
  }
}, {
  // =========
  // DELETE
  // =========
  name: 'delete',
  icon: 'times',
  label: 'status.delete',
  if ({ status, loggedIn, currentUser }) {
    return loggedIn && (
      status.user.id === currentUser.id ||
        currentUser.privileges.includes('messages_delete')
    )
  },
  confirm: ({ getters }) => getters.mergedConfig.modalOnDelete,
  confirmStrings: {
    title: 'status.delete_confirm_title',
    body: 'status.delete_confirm',
    confirm: 'status.delete_confirm_accept_button',
    cancel: 'status.delete_confirm_cancel_button'
  },
  action ({ dispatch, status }) {
    return dispatch('deleteStatus', { id: status.id })
  }
}, {
  // =========
  // SHARE/COPY
  // =========
  name: 'share',
  icon: 'share-alt',
  label: 'status.copy_link',
  action ({ state, status, router }) {
    navigator.clipboard.writeText([
      state.instance.server,
      router.resolve({ name: 'conversation', params: { id: status.id } }).href
    ].join(''))
    return Promise.resolve()
  }
}, {
  // =========
  // EXTERNAL
  // =========
  name: 'external',
  icon: 'external-link-alt',
  label: 'status.external_source',
  link: ({ status }) => status.external_url
}, {
  // =========
  // REPORT
  // =========
  name: 'report',
  icon: 'flag',
  label: 'user_card.report',
  if: ({ loggedIn }) => loggedIn,
  action ({ status }) {
    return useReportsStore().openUserReportingModal({ userId: status.user.id, statusIds: [status.id] })
  }
}].map(button => {
  return Object.fromEntries(
    Object.entries(button).map(([k, v]) => [
      k,
      (typeof v === 'function' || k === 'name') ? v : () => v
    ])
  )
})
