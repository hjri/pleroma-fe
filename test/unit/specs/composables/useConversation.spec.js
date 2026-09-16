import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { mockMastoAPIStatus, mockStatus } from 'test/fixtures/masto_api.js'
import { ref } from 'vue'

import { useStatusesStore } from 'src/stores/statuses.js'

import { useConversation } from 'src/composables/useConversation.js'

import {
  MASTODON_STATUS_CONTEXT_URL,
  MASTODON_STATUS_FAVORITEDBY_URL,
  MASTODON_STATUS_REBLOGGEDBY_URL,
  MASTODON_STATUS_URL,
  PLEROMA_EMOJI_REACTIONS_URL,
} from 'src/api/public.js'

describe('useConversation', () => {
  const constructStatus = (index, convoId = '1000') => {
    const stringId = index.toString()
    const object = { id: stringId, statusnet_conversation_id: convoId }
    if (index > 0) {
      object.in_reply_to_status_id = (index - 1).toString()
    }

    return mockStatus(object)
  }
  const constructStatusAPI = (index, convoId = '1000') => {
    const stringId = index.toString()
    const object = { id: stringId, statusnet_conversation_id: convoId }
    if (index > 0) {
      object.in_reply_to_status_id = (index - 1).toString()
    }

    return mockMastoAPIStatus(object)
  }

  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
    vi.useFakeTimers()
    useStatusesStore().resetStatuses()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('should work if status is unknown yet', () => {
    useStatusesStore().allStatuses = new Map()

    const result = useConversation(ref('1'), ref(false))

    expect(result.focusedId.value).to.eql(null)
    expect(result.currentStatus.value).to.eql(null)
    expect(result.mainStatus.value).to.eql(null)
    expect(result.replies.value).to.eql(new Map())
    expect(result.conversationId.value).to.eql(null)
    expect(result.conversation.value).to.eql([])
    expect(result.loadError.value).to.eql(null)
  })

  it('should return single item that is already known when not expanded', () => {
    useStatusesStore().allStatuses = new Map(
      [...new Array(20)].map((i, index) => [
        index.toString(),
        constructStatus(index),
      ]),
    )

    const result = useConversation(ref('1'), ref(false))
    const expectedStatus = constructStatus(1)

    expect(result.focusedId.value).to.eql(null)
    expect(result.currentStatus.value).to.eql(expectedStatus)
    expect(result.mainStatus.value).to.eql(expectedStatus)
    expect(result.conversation.value).to.eql([expectedStatus])
    expect(result.conversationId.value).to.eql('1000')
  })

  it('should return entire conversation when fethed', async () => {
    const convoAPI = [...new Array(20)].map((i, index) =>
      constructStatusAPI(index),
    )

    const mockFetch = vi.fn()
    vi.when(mockFetch, { onUnmatched: 'throw' })
      .calledWith(MASTODON_STATUS_URL('4'), expect.anything())
      .thenResolveOnce(
        new Response(JSON.stringify(convoAPI[4]), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .calledWith(MASTODON_STATUS_CONTEXT_URL('4'), expect.anything())
      .thenResolveOnce(
        new Response(
          JSON.stringify({
            ancestors: convoAPI.slice(0, 4),
            descendants: convoAPI.slice(5),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
    vi.stubGlobal('fetch', mockFetch)

    const result = useConversation(ref('4'), ref(true))
    await result.fetchConversation()

    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_URL('4'),
      expect.anything(),
    )
    expect(result.conversation.value).to.have.length(1)
    expect(result.conversation.value[0]).to.have.property('id', '4')
    expect(result.conversationId.value).to.have.eql('1000')

    await vi.advanceTimersToNextTimerAsync()
    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_CONTEXT_URL('4'),
      expect.anything(),
    )
    expect(result.conversation.value).to.have.length(20)
    expect(result.conversation.value[0]).to.have.property('id', '0')
  })

  it('should fetch entire conversation when expanded', async () => {
    const convo = [...new Array(20)].map((i, index) => constructStatus(index))
    const convoAPI = [...new Array(20)].map((i, index) =>
      constructStatusAPI(index),
    )
    useStatusesStore().addNewStatuses({
      statuses: [convo[4]],
      timestamp: Date.now(),
    })

    const mockFetch = vi.fn()
    vi.when(mockFetch)
      .calledWith(MASTODON_STATUS_CONTEXT_URL('4'), expect.anything())
      .thenResolveOnce(
        new Response(
          JSON.stringify({
            ancestors: convoAPI.slice(0, 4),
            descendants: convoAPI.slice(5),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
    vi.stubGlobal('fetch', mockFetch)

    const expanded = ref(false)
    const result = useConversation(ref('4'), expanded)
    expect(result.conversation.value).to.have.length(1)
    expect(result.conversation.value[0]).to.have.property('id', '4')
    expect(result.focusedId.value).to.eql(null)
    expanded.value = true
    await vi.advanceTimersToNextTimerAsync()
    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_CONTEXT_URL('4'),
      expect.anything(),
    )
    await vi.advanceTimersToNextTimerAsync()
    expect(result.focusedId.value).to.eql('4')
    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_FAVORITEDBY_URL('4'),
      expect.anything(),
    )
    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_REBLOGGEDBY_URL('4'),
      expect.anything(),
    )
    expect(mockFetch).to.have.been.calledWith(
      PLEROMA_EMOJI_REACTIONS_URL('4'),
      expect.anything(),
    )
    await vi.advanceTimersToNextTimerAsync()
    expect(result.conversation.value).to.have.length(20)
    expect(result.conversation.value[0]).to.have.property('id', '0')
  })

  it('should reset and fetch another conversation when statusId changes', async () => {
    const aConvoAPI = [...new Array(20)].map((i, index) =>
      constructStatusAPI(index + 'a', '1000'),
    )
    const bConvoAPI = [...new Array(20)].map((i, index) =>
      constructStatusAPI(index + 'b', '2000'),
    )

    const mockFetch = vi.fn()
    vi.when(mockFetch, { onUnmatched: 'throw' })
      .calledWith(MASTODON_STATUS_URL('4a'), expect.anything())
      .thenResolveOnce(
        new Response(JSON.stringify(aConvoAPI[4]), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .calledWith(MASTODON_STATUS_CONTEXT_URL('4a'), expect.anything())
      .thenResolveOnce(
        new Response(
          JSON.stringify({
            ancestors: aConvoAPI.slice(0, 4),
            descendants: aConvoAPI.slice(5),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .calledWith(MASTODON_STATUS_URL('4b'), expect.anything())
      .thenResolveOnce(
        new Response(JSON.stringify(bConvoAPI[4]), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .calledWith(MASTODON_STATUS_CONTEXT_URL('4b'), expect.anything())
      .thenResolveOnce(
        new Response(
          JSON.stringify({
            ancestors: bConvoAPI.slice(0, 4),
            descendants: bConvoAPI.slice(5),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
    vi.stubGlobal('fetch', mockFetch)

    const statusId = ref('4a')

    const result = useConversation(statusId, true)
    await result.fetchConversation()

    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_URL('4a'),
      expect.anything(),
    )
    expect(result.conversation.value).to.have.length(1)
    expect(result.conversation.value[0]).to.have.property('id', '4a')
    expect(result.conversationId.value).to.have.eql('1000')

    await vi.advanceTimersToNextTimerAsync()
    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_CONTEXT_URL('4a'),
      expect.anything(),
    )
    expect(result.conversation.value).to.have.length(20)
    expect(result.conversation.value[0]).to.have.property('id', '0a')

    statusId.value = '4b'

    await vi.advanceTimersToNextTimerAsync()
    expect(result.conversation.value).to.have.length(0)

    await vi.advanceTimersToNextTimerAsync()
    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_URL('4b'),
      expect.anything(),
    )
    expect(result.conversation.value).to.have.length(1)
    expect(result.conversation.value[0]).to.have.property('id', '4b')
    expect(result.conversationId.value).to.have.eql('2000')

    await vi.advanceTimersToNextTimerAsync()
    expect(mockFetch).to.have.been.calledWith(
      MASTODON_STATUS_CONTEXT_URL('4b'),
      expect.anything(),
    )
    expect(result.conversation.value).to.have.length(20)
    expect(result.conversation.value[0]).to.have.property('id', '0b')
  })

  it('should form replies object', async () => {
    const convo = [...new Array(4)].map((i, index) => constructStatus(index))
    const convoAPI = [...new Array(4)].map((i, index) =>
      constructStatusAPI(index),
    )
    useStatusesStore().addNewStatuses({
      statuses: convo,
      timestamp: Date.now(),
    })

    const mockFetch = vi.fn()
    vi.when(mockFetch)
      .calledWith(MASTODON_STATUS_CONTEXT_URL('2'), expect.anything())
      .thenResolveOnce(
        new Response(
          JSON.stringify({
            ancestors: convoAPI.slice(0, 1),
            descendants: convoAPI.slice(2),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
    vi.stubGlobal('fetch', mockFetch)

    const result = useConversation('2', true)
    await result.fetchConversation()

    await vi.advanceTimersToNextTimerAsync()
    await vi.advanceTimersToNextTimerAsync()
    await vi.advanceTimersToNextTimerAsync()
    expect(result.conversation.value).to.have.length(4)
    expect(result.replies.value).to.eql(
      new Map([
        ['0', new Set([{ name: '#1', id: '1' }])],
        ['1', new Set([{ name: '#2', id: '2' }])],
        ['2', new Set([{ name: '#3', id: '3' }])],
      ]),
    )
  })
})
