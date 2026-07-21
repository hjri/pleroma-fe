import { shallowMount } from '@vue/test-utils'

import ChatMessageList from './chat_message_list.vue'

describe('ChatMessageList', () => {
  describe('computed.chatItems', () => {
    it('Inserts date separators', () => {
      const component = shallowMount(ChatMessageList, {
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

      expect(component.vm.chatItems.map((i) => i.type)).to.eql([
        'message',
        'message',
        'date',
        'message',
      ])
    })

    it('Inserts date header if needed', () => {
      const component = shallowMount(ChatMessageList, {
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

      expect(component.vm.chatItems.map((i) => i.type)).to.eql([
        'date',
        'message',
      ])
    })

    it('Inserts time separators if messages were sent with considerable delay (5 minutes)', () => {
      const component = shallowMount(ChatMessageList, {
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

      expect(component.vm.chatItems.map((i) => i.type)).to.eql([
        'message',
        'date',
        'message',
        'date',
        'message',
      ])
      expect(component.vm.chatItems.map((i) => i.isTime)).to.eql([
        undefined,
        true,
        undefined,
        false,
        undefined,
      ])
    })

    it('Groups message chains by time and author', () => {
      const component = shallowMount(ChatMessageList, {
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
      expect(component.vm.chatItems.map((i) => i.type)).to.eql([
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
      expect(component.vm.chatItems.map((i) => [i.isHead, i.isTail])).to.eql([
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
      expect(component.vm.chatItems[5].messageChainId).to.eql(
        component.vm.chatItems[6].messageChainId,
      )

      // Message from Even right after Bob
      expect(component.vm.chatItems[7].messageChainId).to.not.eql(
        component.vm.chatItems[8].messageChainId,
      )
    })
  })
  describe('methods.getPreviousItem', () => {
    describe('Finds correct previous meaningful (non-separator) message in the chatlist', () => {
      let component

      beforeEach(() => {
        component = shallowMount(ChatMessageList, {
          props: {
            messages: [
              {
                id: '0',
                account_id: 'Alice',
                created_at: new Date('2020-06-22T20:00:00.000Z'),
              },
              {
                // Separator
                id: '1', // 2
                account_id: 'Alice',
                created_at: new Date('2020-06-22T20:06:00.000Z'),
              },
              {
                // Separator
                id: '2', // 4
                account_id: 'Alice',
                created_at: new Date('2020-06-23T20:00:00.000Z'),
              },
              {
                id: '3', // 5
                account_id: 'Bob',
                created_at: new Date('2020-06-23T20:01:00.000Z'),
              },
              {
                id: '4', // 6
                account_id: 'Bob',
                created_at: new Date('2020-06-23T20:02:00.000Z'),
              },
              {
                id: '5', // 7
                account_id: 'Bob',
                created_at: new Date('2020-06-23T20:03:00.000Z'),
              },
              {
                id: '6', // 8
                account_id: 'Eve',
                created_at: new Date('2020-06-23T20:04:00.000Z'),
              },
            ],
          },
        })
      })

      it('Directly next to each other', () => {
        const correct = component.vm.chatItems[6]
        expect(component.vm.getPreviousItem(7)).to.eql(correct)
      })

      it('Across separator', () => {
        const correct = component.vm.chatItems[2]
        expect(component.vm.getPreviousItem(4)).to.eql(correct)
      })

      it('Returns null if no previous item exist', () => {
        const correct = null
        expect(component.vm.getPreviousItem(0)).to.eql(correct)
      })
    })
  })
})
