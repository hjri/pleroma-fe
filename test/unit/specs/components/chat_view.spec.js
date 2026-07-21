import { createTestingPinia } from '@pinia/testing'
import { shallowMount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'

import ChatView from './chat_view.vue'

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

const global = {
  mocks: {
    $store: {
      state: {
        api: {},
        users: {},
      },
    },
    $route: {
      params: {
        recipient_id: 2,
      },
    },
    $router: {
      push: () => {
        /* noop */
      },
    },
  },
  stubs: {
    FAIcon: true,
  },
}

describe('ChatView methods', () => {
  let component
  beforeEach(() => {
    setActivePinia(createTestingPinia())
    component = shallowMount(ChatView, { global, props: { testMode: true } })
    component.vm.chat = { id: 2 }
  })

  describe('addMessages', () => {
    it("Doesn't add duplicates", () => {
      component.vm.addMessages({ messages: [message1] })
      component.vm.addMessages({ messages: [message1] })
      expect(component.vm.messages.length).to.eql(1)

      component.vm.addMessages({ messages: [message2] })
      expect(component.vm.messages.length).to.eql(2)
    })

    it('Updates minId and lastMessage and newMessageCount', () => {
      component.vm.addMessages({ messages: [message1] })
      expect(component.vm.maxId).to.eql(message1.id)
      expect(component.vm.minId).to.eql(message1.id)
      expect(component.vm.newMessageCount).to.eql(1)

      component.vm.addMessages({ messages: [message2] })
      expect(component.vm.maxId).to.eql(message2.id)
      expect(component.vm.minId).to.eql(message1.id)
      expect(component.vm.newMessageCount).to.eql(2)

      component.vm.readChat()
      expect(component.vm.newMessageCount).to.eql(0)
      expect(component.vm.lastReadMessageId).to.eql(message2.id)

      // Add message with higher id
      component.vm.addMessages({ messages: [message3] })
      expect(component.vm.newMessageCount).to.eql(1)
    })
  })

  describe('deleteChatMessage', () => {
    it('Updates minId and lastMessage', () => {
      component.vm.addMessages({ messages: [message1] })
      component.vm.addMessages({ messages: [message2] })
      component.vm.addMessages({ messages: [message3] })

      expect(component.vm.maxId).to.eql(message3.id)
      expect(component.vm.minId).to.eql(message1.id)

      component.vm.deleteChatMessage({ messageId: message3.id })
      expect(component.vm.maxId).to.eql(message2.id)
      expect(component.vm.minId).to.eql(message1.id)

      component.vm.deleteChatMessage({ messageId: message1.id })
      expect(component.vm.maxId).to.eql(message2.id)
      expect(component.vm.minId).to.eql(message2.id)
    })
  })

  describe('cullOlder', () => {
    it('keeps 50 newest messages and messagesIndex matches', () => {
      for (let i = 100; i > 0; i--) {
        // Use decimal values with toFixed to hack together constant length predictable strings
        component.vm.addMessages({
          messages: [
            {
              ...message1,
              id: 'a' + (i / 1000).toFixed(3),
              idempotency_key: i,
            },
          ],
        })
      }
      component.vm.cullOlder()
      expect(component.vm.messages.length).to.eql(50)
      expect(component.vm.messages[0].id).to.eql('a0.051')
      expect(component.vm.minId).to.eql('a0.051')
      expect(component.vm.messages[49].id).to.eql('a0.100')
      expect(Object.keys(component.vm.messagesIndex).length).to.eql(50)
    })
  })
})
