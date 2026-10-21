import { mapActions } from 'pinia'

import BasicUserCard from '../basic_user_card/basic_user_card.vue'

import { useFollowRequestsStore } from 'src/stores/follow_requests.js'

const FollowRequestCard = {
  props: ['user'],
  components: {
    BasicUserCard,
  },
  methods: {
    ...mapActions(useFollowRequestsStore, ['approve', 'deny']),
  },
}

export default FollowRequestCard
