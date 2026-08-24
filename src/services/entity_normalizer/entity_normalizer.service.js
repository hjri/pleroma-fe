import { parseLinkHeader } from '@web3-storage/parse-link-header'
import escapeHtml from 'escape-html'
import { unescape as lodashUnescape } from 'lodash'
import punycode from 'punycode.js'

import { fileType } from '../file_type/file_type.service.js'
import { isStatusNotification } from '../notification_utils/notification_utils_sw.js'

/** NOTICE! **
 * Do not initialize UI-generated data here.
 * It will override existing data.
 *
 * i.e. user.pinnedStatusIds was set to [] here
 * UI code would update it with data but upon next user fetch
 * it would be reverted back to []
 */

export const parseUser = (data) => {
  const output = {}
  output._original = data // used for server-side settings

  // case for users in "mentions" property for statuses in MastoAPI
  const mastoShort = !Object.hasOwn(data, 'avatar')

  output.inLists = null
  output.id = String(data.id)

  output.screen_name = data.acct
  output.fqn = data.fqn
  output.url = data.url
  output.statusnet_profile_url = data.url

  if (Object.hasOwn(data, 'mute_expires_at')) {
    output.mute_expires_at =
      data.mute_expires_at == null ? false : data.mute_expires_at
  }

  if (Object.hasOwn(data, 'block_expires_at')) {
    output.block_expires_at =
      data.block_expires_at == null ? false : data.block_expires_at
  }

  // There's nothing else to get
  if (mastoShort) {
    return output
  }

  output.emoji = data.emojis
  output.name = escapeHtml(data.display_name)
  output.name_html = output.name
  output.name_unescaped = data.display_name

  output.description = data.note
  // TODO cleanup this shit, output.description is overriden with source data
  output.description_html = data.note

  output.fields = data.fields
  output.fields_html = data.fields.map((field) => {
    return {
      name: escapeHtml(field.name),
      value: field.value,
    }
  })
  output.fields_text = data.fields.map((field) => {
    return {
      name: unescape(field.name.replaceAll(/<[^>]*>/g, '')),
      value: unescape(field.value.replaceAll(/<[^>]*>/g, '')),
    }
  })

  // Utilize avatar_static for gif avatars?
  output.profile_image_url = data.avatar
  output.profile_image_url_original = data.avatar

  // Same, utilize header_static?
  output.cover_photo = data.header

  output.friends_count = data.following_count

  output.bot = data.bot

  output.privileges = []

  output.friendIds = new Set()
  output.followerIds = new Set()

  if (data.pleroma) {
    if (data.pleroma.settings_store) {
      output.storage = data.pleroma.settings_store['pleroma-fe']
      output.user_highlight = data.pleroma.settings_store['user_highlight']
    }
    const relationship = data.pleroma.relationship

    output.background_image = data.pleroma.background_image
    output.favicon = data.pleroma.favicon
    output.token = data.pleroma.chat_token

    if (relationship) {
      output.relationship = relationship
    }

    output.allow_following_move = data.pleroma.allow_following_move

    output.hide_favorites = data.pleroma.hide_favorites
    output.hide_follows = data.pleroma.hide_follows
    output.hide_followers = data.pleroma.hide_followers
    output.hide_follows_count = data.pleroma.hide_follows_count
    output.hide_followers_count = data.pleroma.hide_followers_count

    output.rights = {
      moderator: data.pleroma.is_moderator,
      admin: data.pleroma.is_admin,
    }
    // TODO: Clean up in UI? This is duplication from what BE does for qvitterapi
    if (output.rights.admin) {
      output.role = 'admin'
    } else if (output.rights.moderator) {
      output.role = 'moderator'
    } else {
      output.role = 'member'
    }

    output.birthday = data.pleroma.birthday

    if (data.pleroma.privileges) {
      output.privileges = new Set(data.pleroma.privileges)
    } else if (data.pleroma.is_admin) {
      output.privileges = new Set([
        'users_read',
        'users_manage_invites',
        'users_manage_activation_state',
        'users_manage_tags',
        'users_manage_credentials',
        'users_delete',
        'messages_read',
        'messages_delete',
        'instances_delete',
        'reports_manage_reports',
        'moderation_log_read',
        'announcements_manage_announcements',
        'emoji_manage_emoji',
        'statistics_read',
      ])
    } else if (data.pleroma.is_moderator) {
      output.privileges = new Set(['messages_delete', 'reports_manage_reports'])
    } else {
      output.privileges = new Set()
    }
  }

  if (data.source) {
    output.description = data.source.note
    output.default_scope = data.source.privacy
    output.fields = data.source.fields
    if (data.source.pleroma) {
      output.no_rich_text = data.source.pleroma.no_rich_text
      output.show_role =
        typeof data.source.pleroma.show_role === 'boolean'
          ? data.source.pleroma.show_role
          : true
      output.discoverable = data.source.pleroma.discoverable
      output.show_birthday = data.pleroma.show_birthday
      output.actor_type = data.source.pleroma.actor_type
    }
  }

  // TODO: handle is_local
  output.is_local = !output.screen_name.includes('@')

  output.created_at = new Date(data.created_at)
  output.locked = data.locked
  output.last_status_at = new Date(data.last_status_at)
  output.followers_count = data.followers_count
  output.statuses_count = data.statuses_count

  if (data.pleroma) {
    output.follow_request_count = data.pleroma.follow_request_count

    output.tags = new Set(data.pleroma.tags)

    // deactivated was changed to is_active in Pleroma 2.3.0
    // so check if is_active is present
    output.deactivated =
      data.pleroma.is_active !== undefined
        ? !data.pleroma.is_active // new backend
        : data.pleroma.deactivated // old backend

    output.notification_settings = data.pleroma.notification_settings
    output.unread_chat_count = data.pleroma.unread_chat_count
  }

  output.tags = output.tags || new Set()
  output.rights = output.rights || {}
  output.notification_settings = output.notification_settings || {}

  // Convert punycode to unicode for UI
  output.screen_name_ui = output.screen_name
  if (output.screen_name?.includes('@')) {
    const parts = output.screen_name.split('@')
    const unicodeDomain = punycode.toUnicode(parts[1])
    if (unicodeDomain !== parts[1]) {
      // Add some identifier so users can potentially spot spoofing attempts:
      // lain.com and xn--lin-6cd.com would appear identical otherwise.
      output.screen_name_ui_contains_non_ascii = true
      output.screen_name_ui = [parts[0], unicodeDomain].join('@')
    } else {
      output.screen_name_ui_contains_non_ascii = false
    }
  }

  return output
}

export const parseAttachment = (data) => {
  const output = {}

  // Not exactly same...
  output.mimetype = data.pleroma ? data.pleroma.mime_type : data.type
  output.meta = data.meta // not present in BE yet
  output.id = data.id

  if (data.type !== 'unknown') {
    // treat gifv like it is "video"
    output.type = data.type === 'gifv' ? 'video' : data.type
  } else {
    output.type = fileType(output.mimetype)
  }
  output.url = data.url
  output.large_thumb_url = data.preview_url
  output.description = lodashUnescape(data.description)

  return output
}

export const parseSource = (data) => {
  const output = {}

  output.text = data.text
  output.spoiler_text = data.spoiler_text
  output.content_type = data.content_type

  return output
}

export const parseStatus = (data) => {
  const output = {}

  output.favorited = data.favourited
  output.fave_num = data.favourites_count

  output.repeated = data.reblogged
  output.repeat_num = data.reblogs_count

  output.bookmarked = data.bookmarked

  output.type = data.reblog ? 'retweet' : 'status'
  output.nsfw = data.sensitive

  output.raw_html = data.content
  output.emojis = data.emojis

  output.tags = new Set(data.tags ?? [])

  output.edited_at = data.edited_at

  const { pleroma } = data

  if (data.pleroma) {
    output.text = pleroma.content
      ? data.pleroma.content['text/plain']
      : data.content
    output.summary = pleroma.spoiler_text
      ? data.pleroma.spoiler_text['text/plain']
      : data.spoiler_text
    output.statusnet_conversation_id = data.pleroma.conversation_id
    output.is_local = pleroma.local
    output.in_reply_to_screen_name = pleroma.in_reply_to_account_acct
    output.thread_muted = pleroma.thread_muted
    output.emoji_reactions = pleroma.emoji_reactions
    output.parent_visible =
      pleroma.parent_visible === undefined ? true : pleroma.parent_visible
    output.quote_visible = pleroma.quote_visible || true
    output.quotes_count = pleroma.quotes_count
    output.bookmark_folder_id = pleroma.bookmark_folder
  } else {
    output.text = data.content
    output.summary = data.spoiler_text
  }

  const quoteRaw = pleroma?.quote || data.quote
  const quoteData = quoteRaw ? parseStatus(quoteRaw) : undefined
  output.quote = quoteData
  output.quote_id =
    data.quote?.id ?? data.quote_id ?? quoteData?.id ?? pleroma?.quote_id
  output.quote_url = data.quote?.url ?? quoteData?.url ?? pleroma?.quote_url

  output.in_reply_to_status_id = data.in_reply_to_id
  output.in_reply_to_user_id = data.in_reply_to_account_id
  output.replies_count = data.replies_count

  if (output.type === 'retweet') {
    output.retweeted_status = parseStatus(data.reblog)
  }

  output.summary_raw_html = escapeHtml(data.spoiler_text)
  output.external_url = data.uri || data.url
  output.poll = data.poll
  if (output.poll) {
    output.poll.options = (output.poll.options || []).map((field) => ({
      ...field,
      title_html: escapeHtml(field.title),
    }))
  }
  output.pinned = data.pinned
  output.muted = data.muted

  output.id = String(data.id)
  output.visibility = data.visibility
  output.card = data.card
  output.created_at = new Date(data.created_at)

  // Converting to string, the right way.
  output.in_reply_to_status_id = output.in_reply_to_status_id
    ? String(output.in_reply_to_status_id)
    : null
  output.in_reply_to_user_id = output.in_reply_to_user_id
    ? String(output.in_reply_to_user_id)
    : null

  output.user = parseUser(data.account)

  output.attentions = (data.mentions || []).map(parseUser)

  output.attachments = (data.media_attachments || []).map(parseAttachment)
  output.deleted = false

  const retweetedStatus = data.reblog
  if (retweetedStatus) {
    output.retweeted_status = parseStatus(retweetedStatus)
  }

  output.favoritedBy = []
  output.rebloggedBy = []

  if (Object.hasOwn(data, 'originalStatus')) {
    Object.assign(output, data.originalStatus)
  }

  return output
}

export const parseNotification = (data) => {
  const mastoDict = {
    favourite: 'like',
    reblog: 'repeat',
  }
  const output = {}

  output.type = mastoDict[data.type] || data.type
  output.seen = data.pleroma.is_seen
  // TODO: null check should be a temporary fix, I guess.
  // Investigate why backend does this.
  output.status =
    isStatusNotification(output.type) && data.status !== null
      ? parseStatus(data.status)
      : null
  output.target = output.type !== 'move' ? null : parseUser(data.target)
  output.from_profile = parseUser(data.account)
  output.emoji = data.emoji
  output.emoji_url = data.emoji_url
  if (data.report) {
    output.report = data.report
    output.report.content = data.report.content
    output.report.acct = parseUser(data.report.account)
    output.report.actor = parseUser(data.report.actor)
    output.report.statuses = data.report.statuses.map(parseStatus)
  }

  output.created_at = new Date(data.created_at)
  output.id = Number.parseInt(data.id)

  return output
}

export const parseLinkHeaderPagination = (linkHeader, opts = {}) => {
  const flakeId = opts.flakeId
  const parsedLinkHeader = parseLinkHeader(linkHeader)
  if (!parsedLinkHeader) return
  const maxId = parsedLinkHeader.next?.max_id
  const minId = parsedLinkHeader.prev?.min_id

  return {
    maxId: flakeId ? maxId : Number.parseInt(maxId, 10),
    minId: flakeId ? minId : Number.parseInt(minId, 10),
  }
}

export const parseChat = (chat) => {
  const output = {}
  output.id = chat.id
  output.account = parseUser(chat.account)
  output.unread = chat.unread
  output.lastMessage = parseChatMessage(chat.last_message)
  output.updated_at = new Date(chat.updated_at)
  return output
}

export const parseChatMessage = (message) => {
  if (!message) {
    return
  }
  if (message.isNormalized) {
    return message
  }
  const output = message
  output.id = message.id
  output.created_at = new Date(message.created_at)
  output.chat_id = message.chat_id
  output.emojis = message.emojis
  output.content = message.content
  if (message.attachment) {
    output.attachments = [parseAttachment(message.attachment)]
  } else {
    output.attachments = []
  }
  output.pending = !!message.pending
  output.error = false
  output.idempotency_key = message.idempotency_key
  output.isNormalized = true
  return output
}
