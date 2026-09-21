import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'

import { useTreeConversationTopology } from 'src/composables/useTreeConversationTopology.js'

describe('useTreeConversationTopology', () => {
  const conversation = [
    {
      id: 1,
    },
    {
      id: 2,
      in_reply_to_status_id: 1,
    },
    {
      id: 3,
      in_reply_to_status_id: 2,
    },
    {
      id: 4,
      in_reply_to_status_id: 1,
    },
    {
      id: 5,
      in_reply_to_status_id: 4,
    },
    {
      id: 6,
      in_reply_to_status_id: 3,
    },
  ]
  const replies = new Map([
    [1, new Set([{ id: 2 }, { id: 4 }])],
    [2, new Set([{ id: 3 }])],
    [3, new Set([{ id: 6 }])],
    [4, new Set([{ id: 5 }])],
    [6, new Set([])],
  ])

  beforeEach(() => {
    setActivePinia(createTestingPinia())
    useStatusesStore().allStatuses = new Map(
      conversation.map(({ id }) => [id, { id }]),
    )
  })

  it('should form a correct topology', () => {
    const { topLevel, ancestors, currentAncestors } =
      useTreeConversationTopology(conversation, null, 3)

    expect(ancestors.value).to.eql(
      new Map([
        [1, new Set()],
        [2, new Set([1])],
        [3, new Set([2, 1])],
        [4, new Set([1])],
        [5, new Set([4, 1])],
        [6, new Set([3, 2, 1])],
      ]),
    )
    expect(currentAncestors.value).to.eql([{ id: 1 }, { id: 2 }])
    expect(topLevel.value.map(({ id }) => id)).to.eql([1])
  })

  describe('ThreadDisplay', () => {
    it('should set default ThreadDisplay with maxDepth 3', () => {
      useMergedConfigStore().mergedConfig = { maxDepthInThread: 3 }

      const { threadDisplay } = useTreeConversationTopology(conversation)

      expect(threadDisplay.value).to.eql(
        new Map([
          [1, 'showing'],
          [2, 'showing'],
          [3, 'hidden'],
          [4, 'showing'],
          [5, 'hidden'],
          [6, 'hidden'],
        ]),
      )
    })

    it('should set default ThreadDisplay with maxDepth 6', () => {
      useMergedConfigStore().mergedConfig = { maxDepthInThread: 6 }

      const { threadDisplay } = useTreeConversationTopology(conversation)

      expect(threadDisplay.value).to.eql(
        new Map([
          [1, 'showing'],
          [2, 'showing'],
          [3, 'showing'],
          [4, 'showing'],
          [5, 'showing'],
          [6, 'showing'],
        ]),
      )
    })

    it('should set default ThreadDisplay with maxDepth 3 && current depth being 3', () => {
      useMergedConfigStore().mergedConfig = { maxDepthInThread: 3 }

      const { threadDisplay } = useTreeConversationTopology(
        conversation,
        null,
        4,
      )

      expect(threadDisplay.value).to.eql(
        new Map([
          [1, 'showing'],
          [2, 'showing'],
          [3, 'showing'],
          [4, 'showing'],
          [5, 'showing'],
          [6, 'hidden'],
        ]),
      )
    })

    it('should recursively expand thread when calling showThreadRecursively', () => {
      useMergedConfigStore().mergedConfig = { maxDepthInThread: 3 }

      const { threadDisplay, showThreadRecursively } =
        useTreeConversationTopology(conversation, replies, 1)

      showThreadRecursively(3)
      expect(threadDisplay.value).to.eql(
        new Map([
          [1, 'showing'],
          [2, 'showing'],
          [3, 'showing'],
          [4, 'showing'],
          [5, 'hidden'],
          [6, 'showing'],
        ]),
      )
    })

    it('should reset thread when calling resetThreadDisplay', () => {
      useMergedConfigStore().mergedConfig = { maxDepthInThread: 3 }

      const { threadDisplay, showThreadRecursively, resetThreadDisplay } =
        useTreeConversationTopology(conversation, replies, 1)

      showThreadRecursively(3)
      resetThreadDisplay()
      expect(threadDisplay.value).to.eql(
        new Map([
          [1, 'showing'],
          [2, 'showing'],
          [3, 'hidden'],
          [4, 'showing'],
          [5, 'hidden'],
          [6, 'hidden'],
        ]),
      )
    })
  })
})
