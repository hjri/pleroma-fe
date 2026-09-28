import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { usePleromaChat } from 'src/composables/usePleromaChat.js'

const message1 = {
  id: '1',
  chat_id: 2,
  idempotency_key: '1',
  created_at: new Date('2020-06-22T18:45:53.000Z'),
}

const message2 = {
  id: '2',
  chat_id: 2,
  idempotency_key: '2',
  account_id: '9vmRb29zLQReckr5ay',
  created_at: new Date('2020-06-22T18:45:56.000Z'),
}

const message3 = {
  id: '3',
  chat_id: 2,
  idempotency_key: '3',
  account_id: '9vmRb29zLQReckr5ay',
  created_at: new Date('2020-07-22T18:45:59.000Z'),
}

describe('usePleromaChat', () => {
  let composable
  beforeEach(() => {
    setActivePinia(createTestingPinia())
    composable = usePleromaChat('1')
    composable._test.chat.value = { id: 2 }
  })

  describe('addMessages', () => {
    it("Doesn't add duplicates", () => {
      composable._test.addMessages([message1])
      composable._test.addMessages([message1])
      expect(composable.messages.value).to.have.length(1)

      composable._test.addMessages([message2])
      expect(composable.messages.value).to.have.length(2)
    })

    it('Updates minId and lastMessage and newMessageCount', async () => {
      composable._test.addMessages([message1])
      expect(composable._test.maxId.value).to.eql(message1.id)
      expect(composable._test.minId.value).to.eql(message1.id)
      expect(composable.newMessagesCount.value).to.eql(1)

      composable._test.addMessages([message2])
      expect(composable._test.maxId.value).to.eql(message2.id)
      expect(composable._test.minId.value).to.eql(message1.id)
      expect(composable.newMessagesCount.value).to.eql(2)

      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', mockFetch)
      await composable.markAsRead()
      expect(composable.newMessagesCount.value).to.eql(0)
      expect(composable._test.lastReadMessageId.value).to.eql(message2.id)

      // Add message with higher id
      composable._test.addMessages([message3])
      expect(composable.newMessagesCount.value).to.eql(1)
    })
  })

  describe('deleteChatMessage', () => {
    it('Updates minId and lastMessage', async () => {
      composable._test.addMessages([message1])
      composable._test.addMessages([message2])
      composable._test.addMessages([message3])

      expect(composable._test.maxId.value).to.eql(message3.id)
      expect(composable._test.minId.value).to.eql(message1.id)

      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', mockFetch)
      await composable.deleteChatMessage({ messageId: message3.id })
      expect(composable._test.maxId.value).to.eql(message2.id)
      expect(composable._test.minId.value).to.eql(message1.id)

      await composable.deleteChatMessage({ messageId: message1.id })
      expect(composable._test.maxId.value).to.eql(message2.id)
      expect(composable._test.minId.value).to.eql(message2.id)
    })
  })
})
