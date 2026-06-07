import { mapState } from 'pinia'

import MentionLink from 'src/components/mention_link/mention_link.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

export const MENTIONS_LIMIT = 5

const MentionsLine = {
  name: 'MentionsLine',
  props: {
    mentions: {
      required: true,
      type: Array,
    },
  },
  data: () => ({ expanded: false }),
  components: {
    MentionLink,
  },
  computed: {
    mentionsComputed() {
      return this.mentions.slice(0, MENTIONS_LIMIT)
    },
    extraMentions() {
      return this.mentions.slice(MENTIONS_LIMIT)
    },
    manyMentions() {
      return this.extraMentions.length > 0
    },
    ...mapState(useMergedConfigStore, ['mergedConfig']),
  },
  methods: {
    toggleShowMore() {
      this.expanded = !this.expanded
    },
  },
}

export default MentionsLine
