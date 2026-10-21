import { merge } from 'lodash-es'
import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

import { fetchPoll } from 'src/api/public.js'
import { vote } from 'src/api/user.js'

export const usePollsStore = defineStore('polls', {
  state: () => ({
    // Contains key = id, value = number of trackers for this poll
    trackedPolls: {},
    pollsObject: {},
  }),
  actions: {
    mergeOrAddPoll(poll) {
      const existingPoll = this.pollsObject[poll.id]
      // Make expired-state change trigger re-renders properly
      poll.expired = Date.now() > Date.parse(poll.expires_at)
      if (existingPoll) {
        this.pollsObject[poll.id] = merge(existingPoll, poll)
      } else {
        this.pollsObject[poll.id] = poll
      }
    },
    updateTrackedPoll(pollId) {
      fetchPoll({
        pollId,
        credentials: useOAuthStore().token,
      }).then(({ data: poll }) => {
        setTimeout(() => {
          if (this.trackedPolls[pollId]) {
            this.updateTrackedPoll(pollId)
          }
        }, 30 * 1000)
        this.mergeOrAddPoll(poll)
      })
    },
    trackPoll(pollId) {
      if (!this.trackedPolls[pollId]) {
        setTimeout(() => this.updateTrackedPoll(pollId), 30 * 1000)
      }
      const currentValue = this.trackedPolls[pollId]
      if (currentValue) {
        this.trackedPolls[pollId] = currentValue + 1
      } else {
        this.trackedPolls[pollId] = 1
      }
    },
    untrackPoll(pollId) {
      const currentValue = this.trackedPolls[pollId]
      if (currentValue) {
        this.trackedPolls[pollId] = currentValue - 1
      } else {
        this.trackedPolls[pollId] = 0
      }
    },
    votePoll({ pollId, choices }) {
      return vote({
        pollId,
        choices,
        credentials: useOAuthStore().token,
      }).then(({ data: poll }) => {
        this.mergeOrAddPoll(poll)
        return poll
      })
    },
  },
})
