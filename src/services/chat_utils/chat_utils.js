import { showDesktopNotification } from '../desktop_notification_utils/desktop_notification_utils.js'

import { useUsersStore } from 'src/stores/users.js'

export const maybeShowChatNotification = (chat) => {
  // No messages
  if (!chat.lastMessage) return
  // No unreads to display
  if (chat.unread === 0) return
  // Don't notify on outgoing message (shouldn't happen with condition above)
  if (useUsersStore().currentUser.id === chat.lastMessage.account_id) return

  const opts = {
    tag: chat.lastMessage.id,
    title: chat.account.name,
    icon: chat.account.profile_image_url,
    body: chat.lastMessage.content,
    type: 'chatMention',
  }

  if (chat.lastMessage.attachment?.type === 'image') {
    opts.image = chat.lastMessage.attachment.preview_url
  }

  showDesktopNotification(opts)
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
    id: 'fake-' + Date.now().toString(),
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
