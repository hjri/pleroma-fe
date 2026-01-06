import {
  showDesktopNotification as swDesktopNotification,
  closeDesktopNotification as swCloseDesktopNotification,
  isSWSupported,
} from '../sw/sw.js'
const state = { failCreateNotif: false }

export const showDesktopNotification = (rootState, desktopNotificationOpts) => {
  if (
    !('Notification' in window && window.Notification.permission === 'granted')
  )
    return
  if (rootState.notifications.desktopNotificationSilence) {
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

export const closeDesktopNotification = (rootState, { id }) => {
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
