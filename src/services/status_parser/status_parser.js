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
    .map((filter) => {
      const { hide, expires, name, value, type, enabled } = filter
      if (!enabled) return false
      if (value === '') return false
      if (expires !== null && expires < Date.now()) return false
      switch (type) {
        case 'word': {
          const lowercaseValue = value.toLowerCase()
          if (
            statusText.toLowerCase().includes(lowercaseValue) ||
            statusSummary.toLowerCase().includes(lowercaseValue)
          ) {
            return { hide, name }
          }
          break
        }
        case 'regexp': {
          try {
            const re = new RegExp(value, 'i')
            if (re.test(statusText) || re.test(statusSummary)) {
              return { hide, name }
            }
            return false
          } catch {
            return false
          }
        }
        case 'user': {
          if (
            poster.includes(value) ||
            replyToUser.includes(value) ||
            mentions.some((mention) => mention.includes(value))
          ) {
            return { hide, name }
          }
          break
        }
        case 'user_regexp': {
          try {
            const re = new RegExp(value, 'i')
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
    .filter((_) => _)
}
