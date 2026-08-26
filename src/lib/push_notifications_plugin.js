import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

export const piniaPushNotificationsPlugin = ({ store }) => {
  const validActions = {
    sync_config: new Set(['setPreference']),
    interface: new Set(['setNotificationPermission', 'onLogin', 'onLogout']),
  }

  if (!validActions[store.$id]) return // Not applicable to the store

  store.$onAction(({ name: actionName, args }) => {
    if (!validActions[store.$id].has(actionName)) return // Not applicable to action

    // Initial state
    let vapidPublicKey = useInstanceStore().vapidPublicKey
    let enabled = useMergedConfigStore().mergedConfig.webPushNotifications
    let permissionGranted =
      useInterfaceStore().notificationPermission === 'granted'
    let permissionPresent =
      useInterfaceStore().notificationPermission !== undefined
    let user = useUsersStore().loggedIn

    if (store.$id === 'instance') {
      if (actionName === 'set' && args[0].path === 'vapidPublicKey') {
        const { value } = args[0]
        vapidPublicKey = value
      }
    }

    if (!vapidPublicKey || !permissionPresent) {
      return
    }

    if (store.$id === 'interface') {
      if (actionName === 'setNotificationPermission') {
        permissionGranted = args[0] === 'granted'
      } else if (actionName === 'setLoginStatus') {
        user = args[0]
      } else {
        return
      }
    } else if (store.$id === 'sync_config') {
      if (
        actionName === 'setPreference' &&
        args[0].path === 'simple.webPushNotifications'
      ) {
        const { value } = args[0]
        enabled = value
      } else {
        return
      }
    }

    if (permissionGranted && enabled && user) {
      return useInterfaceStore().registerPushNotifications()
    } else {
      return useInterfaceStore().unregisterPushNotifications()
    }
  })
}
