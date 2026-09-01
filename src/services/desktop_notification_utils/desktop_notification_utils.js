import {
  isSWSupported,
  closeDesktopNotification as swCloseDesktopNotification,
  showDesktopNotification as swDesktopNotification,
} from '../sw/sw.js'

import { useNotificationsStore } from 'src/stores/notifications.js'

const state = { failCreateNotif: false }

export const showDesktopNotification = (desktopNotificationOpts) => {
  if (
    !('Notification' in window && window.Notification.permission === 'granted')
  )
    return
  if (useNotificationsStore().desktopNotificationSilence) {
    return
  }

  if (isSWSupported()) {
    swDesktopNotification(desktopNotificationOpts)
  } else if (!state.failCreateNotif) {
    try {
      const desktopNotification = new window.Notification(
        desktopNotificationOpts.title,
        desktopNotificationOpts,
      )
      setTimeout(desktopNotification.close.bind(desktopNotification), 5000)
    } catch {
      state.failCreateNotif = true
    }
  }
}

export const closeDesktopNotification = (id) => {
  if (
    !('Notification' in window && window.Notification.permission === 'granted')
  )
    return

  if (isSWSupported()) {
    swCloseDesktopNotification({ id })
  }
}

export const closeAllDesktopNotifications = () => {
  if (
    !('Notification' in window && window.Notification.permission === 'granted')
  )
    return

  if (isSWSupported()) {
    swCloseDesktopNotification({})
  }
}
