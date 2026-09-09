import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'

export function useTreeConversationTopology(conversation, replies, current) {
  const getStatusObject = (id) => useStatusesStore().allStatuses.get(id)
  const getReplies = (id) => replies.value.get(id) ?? new Set()

  const { mergedConfig } = storeToRefs(useMergedConfigStore())

  const maxDepthToShowByDefault = computed(() => {
    // maxDepthInThread = max number of depths that is *visible*
    // since our depth starts with 0 and "showing" means "showing children"
    // there is a -2 here
    const maxDepth = mergedConfig.value.maxDepthInThread - 2
    return Math.min(1, maxDepth)
  })

  const ancestors = computed(() => {
    // First we fill map with empty sets and add given id's parent
    // as set's only element (if any)
    const parentMap = conversation.value.reduce(
      (result, { id, in_reply_to_status_id: irid }) => {
        if (!result.has(id)) {
          result.set(id, new Set())
        }
        if (irid) {
          // Setting parent for current item
          result.get(id).add(irid)
        }
        return result
      },
      new Map(),
    )

    // Next we iterate over each entry and fill the whole ancestry chain
    parentMap.entries().forEach(([originId, originSet]) => {
      let current = originSet.values().next().value
      while (current) {
        originSet.add(current)

        const parent = parentMap.get(current) ?? new Set()

        current = parent.values().next().value
      }
    })
    return parentMap
  })
  const topLevel = computed(() =>
    [...ancestors.value.entries()]
      .filter(([id, ancestors]) => ancestors.size === 0)
      .map(([id]) => getStatusObject(id)),
  )
  const getAncestorIds = (id) => ancestors.value.get(id) ?? new Set()
  const getAncestors = (id) =>
    [...getAncestorIds(id)].map(getStatusObject).filter(Boolean)
  const currentAncestors = computed(() => getAncestors(current.value).reverse())
  const currentDepth = computed(() => currentAncestors.value.length)

  // Thread Display, for collapsing/expanding tree branches
  // Map of id => 'showing' | 'hidden'
  const threadDisplayOverride = ref(new Map())
  const threadDisplayDefault = computed(() => {
    return conversation.value.reduce((map, status) => {
      const { id } = status
      const depth = ancestors.value.get(id).size

      const state = (() => {
        if (depth - currentDepth.value <= maxDepthToShowByDefault.value) {
          return 'showing'
        } else {
          return 'hidden'
        }
      })()

      map.set(id, state)
      return map
    }, new Map())
  })
  const threadDisplay = computed(() => {
    return new Map(
      [...threadDisplayOverride.value.entries()].map(([k, v]) => [
        k,
        threadDisplayOverride.value.get(k) ?? threadDisplayDefault.value.get(k),
      ]),
    )
  })

  const setThreadDisplayRecursively = (id, value) => {
    threadDisplayOverride.value.set(id, value)
    ;[...getReplies(id)]
      .map((k) => k.id)
      .map((id) => setThreadDisplayRecursively(id, value))
  }
  const showThreadRecursively = (id) => {
    setThreadDisplayRecursively(id, 'showing')
  }
  const resetThreadDisplay = () => {
    threadDisplayOverride.value = new Map()
  }

  return {
    topLevel,
    currentAncestors,
    threadDisplay,
    showThreadRecursively,
    resetThreadDisplay,
  }
}
