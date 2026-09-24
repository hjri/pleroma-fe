import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'

import ChatMessageList from 'src/components/chat_message_list/chat_message_list.vue'
const scrollPositionInstance = {
  x: ref(0),
  y: ref(0),
  vHeight: ref(768),
  vWidth: ref(1024),
  vHeight: ref(768),
  vWidth: ref(1024),
  scrollBy: vi.fn(),
  hasReachedTop: ref(false),
  hasReachedBottom: ref(false),
}
const global = {
  provide: {
    bodyScrollPosition: scrollPositionInstance
  }
}

describe('ChatMessageList', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
  })

  describe('computed.chatItems.value', () => {
    it('Inserts date separators', () => {
      const component = shallowMount(ChatMessageList, {
        global,
        props: {
          messages: [
            {
              id: '0',
              account_id: 'Alice',
              created_at: new Date('2020-06-22T20:00:00.000Z'),
            },
            {
              id: '1',
              account_id: 'Alice',
              created_at: new Date('2020-06-22T20:01:00.000Z'),
            },
            {
              id: '2',
              account_id: 'Alice',
              created_at: new Date('2020-06-23T20:00:00.000Z'),
            },
          ],
        },
      })

      expect(component.vm._test.chatItems.value.map((i) => i.type)).to.eql([
        'message',
        'message',
        'date',
        'message',
      ])
    })

    it('Inserts date header if needed', () => {
      const component = shallowMount(ChatMessageList, {
        global,
        props: {
          headerDate: true,
          messages: [
            {
              id: '0',
              account_id: 'Alice',
              created_at: new Date('2020-06-23T20:00:00.000Z'),
            },
          ],
        },
      })

      expect(component.vm._test.chatItems.value.map((i) => i.type)).to.eql([
        'date',
        'message',
      ])
    })

    it('Inserts time separators if messages were sent with considerable delay (5 minutes)', () => {
      const component = shallowMount(ChatMessageList, {
        global,
        props: {
          messages: [
            {
              id: '0',
              account_id: 'Alice',
              created_at: new Date('2020-06-22T20:00:00.000Z'),
            },
            {
              id: '1',
              account_id: 'Alice',
              created_at: new Date('2020-06-22T20:06:00.000Z'),
            },
            {
              id: '2',
              account_id: 'Alice',
              created_at: new Date('2020-06-23T20:00:00.000Z'),
            },
          ],
        },
      })

      expect(component.vm._test.chatItems.value.map((i) => i.type)).to.eql([
        'message',
        'date',
        'message',
        'date',
        'message',
      ])
      expect(component.vm._test.chatItems.value.map((i) => i.isTime)).to.eql([
        undefined,
        true,
        undefined,
        false,
        undefined,
      ])
    })

    it('Groups message chains by time and author', () => {
      const component = shallowMount(ChatMessageList, {
        global,
        props: {
          messages: [
            {
              id: '0',
              account_id: 'Alice',
              created_at: new Date('2020-06-22T20:00:00.000Z'),
            },
            {
              id: '1',
              account_id: 'Alice',
              created_at: new Date('2020-06-22T20:06:00.000Z'),
            },
            {
              id: '2',
              account_id: 'Alice',
              created_at: new Date('2020-06-23T20:00:00.000Z'),
            },
            {
              id: '3',
              account_id: 'Bob',
              created_at: new Date('2020-06-23T20:01:00.000Z'),
            },
            {
              id: '4',
              account_id: 'Bob',
              created_at: new Date('2020-06-23T20:02:00.000Z'),
            },
            {
              id: '5',
              account_id: 'Bob',
              created_at: new Date('2020-06-23T20:03:00.000Z'),
            },
            {
              id: '6',
              account_id: 'Eve',
              created_at: new Date('2020-06-23T20:04:00.000Z'),
            },
          ],
        },
      })

      // Type check
      expect(component.vm._test.chatItems.value.map((i) => i.type)).to.eql([
        'message',
        'date',
        'message',
        'date',
        'message',
        'message',
        'message',
        'message',
        'message',
      ])

      // Chain head/Tail checks
      expect(component.vm._test.chatItems.value.map((i) => [i.isHead, i.isTail])).to.eql([
        [true, true],
        [undefined, undefined],
        [true, true],
        [undefined, undefined],
        [true, true],
        [true, false],
        [false, false],
        [false, true],
        [true, true],
      ])

      // Unique ID is randomly generated so we have to compare data against itself
      // Two messages from Bob next to each other
      expect(component.vm._test.chatItems.value[5].messageChainId).to.eql(
        component.vm._test.chatItems.value[6].messageChainId,
      )

      // Message from Even right after Bob
      expect(component.vm._test.chatItems.value[7].messageChainId).to.not.eql(
        component.vm._test.chatItems.value[8].messageChainId,
      )
    })
  })
})
