import { showDesktopNotification } from '../desktop_notification_utils/desktop_notification_utils.js'

export const maybeShowChatNotification = (chat) => {
  if (!chat.lastMessage) return
  if (window.vuex.state.users.currentUser.id === chat.lastMessage.account_id)
    return

  const opts = {
    tag: chat.lastMessage.id,
    title: chat.account.name,
    icon: chat.account.profile_image_url,
    body: chat.lastMessage.content,
  }

  if (
    chat.lastMessage.attachment?.type === 'image'
  ) {
    opts.image = chat.lastMessage.attachment.preview_url
  }

  showDesktopNotification(window.vuex.state, opts)
}

export const buildFakeMessage = ({
  content,
  chatId,
  attachments,
  userId,
  idempotencyKey,
}) => {
  const fakeMessage = {
    content,
    chat_id: chatId,
    created_at: new Date(),
    id: `${new Date().getTime()}`,
    attachments,
    account_id: userId,
    idempotency_key: idempotencyKey,
    emojis: [],
    pending: true,
    isNormalized: true,
  }

  if (attachments[0]) {
    fakeMessage.attachment = attachments[0]
  }

  return fakeMessage
}
