import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useNotificationsStore } from 'src/stores/notifications.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import * as NotificationUtils from 'src/services/notification_utils/notification_utils.js'

describe('NotificationUtils', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia())
    useSyncConfigStore().mergedConfig = {
      notificationVisibility: {
        likes: true,
        repeats: true,
        mentions: false,
      },
    }
  })

  describe('filteredNotifications', () => {
    it('should return sorted notifications with configured types', () => {
      useNotificationsStore().data = [
        {
          id: 1,
          action: { id: '1' },
          type: 'like',
        },
        {
          id: 2,
          action: { id: '2' },
          type: 'mention',
        },
        {
          id: 3,
          action: { id: '3' },
          type: 'repeat',
        },
      ]

      const expected = [
        {
          action: { id: '3' },
          id: 3,
          type: 'repeat',
        },
        {
          action: { id: '1' },
          id: 1,
          type: 'like',
        },
      ]
      expect(
        NotificationUtils.filteredNotifications({
          mentions: false,
          likes: true,
          repeats: true,
        }),
      ).to.eql(expected)
    })
  })

  describe('unseenNotifications', () => {
    it('should return only notifications not marked as seen', () => {
      useNotificationsStore().data = [
        {
          action: { id: '1' },
          type: 'like',
          seen: false,
        },
        {
          action: { id: '2' },
          type: 'mention',
          seen: true,
        },
      ]

      const expected = [
        {
          action: { id: '1' },
          type: 'like',
          seen: false,
        },
      ]
      expect(
        NotificationUtils.unseenNotifications({
          likes: true,
          repeats: true,
          mentions: false,
        }),
      ).to.eql(expected)
    })
  })
})
