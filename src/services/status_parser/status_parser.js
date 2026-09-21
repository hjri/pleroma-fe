export const muteFilterHits = (muteFilters, status) => {
  const statusText = status.text.toLowerCase()
  const statusSummary = status.summary.toLowerCase()
  const replyToUser = status.in_reply_to_screen_name?.toLowerCase()
  const poster = status.user.screen_name?.toLowerCase()
  const mentions = (status.attentions || []).map((att) =>
    att.screen_name.toLowerCase(),
  )

  return muteFilters
    .toSorted((a, b) => b.order - a.order)
    .filter((filter) => filter.enabled && filter.value !== '')
    .filter(({ expires }) => {
      if (expires !== null) return expires >= Date.now()
      return true
    })
    .map((filter) => {
      const {
        hide,
        name,
        value,
        type,
        caseSensitive = false,
      } = filter
      switch (type) {
        case 'word': {
          let match = false
          if (caseSensitive) {
            match = statusText.includes(value) || statusSummary.includes(value)
          } else {
            const lowercaseValue = value.toLowerCase()
            match =
              statusText.toLowerCase().includes(lowercaseValue) ||
              statusSummary.toLowerCase().includes(lowercaseValue)
          }

          if (match) {
            return { hide, name }
          }
          break
        }
        case 'regexp': {
          try {
            const re = new RegExp(value, caseSensitive ? '' : 'i')
            if (re.test(statusText) || re.test(statusSummary)) {
              return { hide, name }
            }
            return false
          } catch {
            return false
          }
        }
        case 'user': {
          let match = false
          if (caseSensitive) {
            match =
              poster.includes(value) ||
              replyToUser.includes(value) ||
              mentions.some((mention) => mention.includes(value))
          } else {
            const lowercaseValue = value.toLowerCase()
            match =
              poster.toLowerCase().includes(lowercaseValue) ||
              replyToUser.toLowerCase().includes(lowercaseValue) ||
              mentions.some((mention) =>
                mention.toLowerCase().includes(lowercaseValue),
              )
          }
          if (match) {
            return { hide, name }
          }
          break
        }
        case 'user_regexp': {
          try {
            const re = new RegExp(value, caseSensitive ? '' : 'i')
            if (
              re.test(poster) ||
              re.test(replyToUser) ||
              mentions.some((mention) => re.test(mention))
            ) {
              return { hide, name }
            }
            return false
          } catch {
            return false
          }
        }
      }
    })
    .filter(Boolean)
}
