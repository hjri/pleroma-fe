import Timeago from 'components/timeago/timeago.vue'
import genRandomSeed from '../../services/random_seed/random_seed.service.js'
import RichContent from 'components/rich_content/rich_content.jsx'
import Checkbox from 'components/checkbox/checkbox.vue'
import { usePollsStore } from 'src/stores/polls'

export default {
  name: 'Poll',
  props: ['basePoll', 'emoji'],
  components: {
    Timeago,
    RichContent,
    Checkbox
  },
  data () {
    return {
      loading: false,
      choices: [],
      randomSeed: genRandomSeed()
    }
  },
  created () {
    if (!usePollsStore().pollsObject[this.pollId]) {
      usePollsStore().mergeOrAddPoll(this.basePoll)
    }
    usePollsStore().trackPoll(this.pollId)
  },
  unmounted () {
    usePollsStore().untrackPoll(this.pollId)
  },
  computed: {
    pollId () {
      return this.basePoll.id
    },
    poll () {
      const storePoll = usePollsStore().pollsObject[this.pollId]
      return storePoll || {}
    },
    options () {
      return (this.poll && this.poll.options) || []
    },
    expiresAt () {
      return (this.poll && this.poll.expires_at) || null
    },
    expired () {
      return (this.poll && this.poll.expired) || false
    },
    expirationLabel () {
      if (this.$store.getters.mergedConfig.useAbsoluteTimeFormat) {
        return this.expired ? 'polls.expired_at' : 'polls.expires_at'
      } else {
        return this.expired ? 'polls.expired' : 'polls.expires_in'
      }
    },
    loggedIn () {
      return this.$store.state.users.currentUser
    },
    showResults () {
      return this.poll.voted || this.expired || !this.loggedIn
    },
    totalVotesCount () {
      return this.poll.votes_count
    },
    containerClass () {
      return {
        loading: this.loading
      }
    },
    choiceIndices () {
      // Convert array of booleans into an array of indices of the
      // items that were 'true', so [true, false, false, true] becomes
      // [0, 3].
      return this.choices
        .map((entry, index) => entry && index)
        .filter(value => typeof value === 'number')
    },
    isDisabled () {
      const noChoice = this.choiceIndices.length === 0
      return this.loading || noChoice
    }
  },
  methods: {
    percentageForOption (count) {
      return this.totalVotesCount === 0 ? 0 : Math.round(count / this.totalVotesCount * 100)
    },
    resultTitle (option) {
      return `${option.votes_count}/${this.totalVotesCount} ${this.$t('polls.votes')}`
    },
    activateOption (index, value) {
      let result
      if (this.poll.multiple) {
        result = this.choices || this.options.map(() => false)
      } else {
        result = this.options.map(() => false)
      }
      result[index] = value
      this.choices = result
    },
    optionId (index) {
      return `poll${this.poll.id}-${index}`
    },
    vote () {
      if (this.choiceIndices.length === 0) return
      this.loading = true
      usePollsStore().votePoll(
        { id: this.statusId, pollId: this.poll.id, choices: this.choiceIndices }
      ).then(() => {
        this.loading = false
      })
    }
  }
}
