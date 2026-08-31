import { useFollowRequestsStore } from 'src/stores/follow_requests.js'

import FollowRequestCard from 'src/components/follow_request_card/follow_request_card.vue'

const FollowRequests = {
  components: {
    FollowRequestCard,
  },
  computed: {
    requests() {
      return useFollowRequestsStore().requests.values()
    },
  },
}

export default FollowRequests
