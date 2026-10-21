export const userId = '1'
export const userScreenName = 'user'
export const userName = 'Guy'
export const userUrl = 'http://localhost/user'

export const fetchOptions = (url, method = 'GET') => [
  url,
  {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
]

export const mockMastoAPIUser = ({
  screen_name = userScreenName,
  name = userName,
  url = userUrl,
  id = userId,
} = {}) => ({
  id,
  acct: screen_name,
  display_name: name,
  fields: [],
  avatar: '',
  url,
  pleroma: {
    emoji_reactions: [],
  },
})

export const mockMastoAPIStatus = ({
  id = '1',
  text,
  type = 'status',
  statusUser = mockMastoAPIUser(),
  in_reply_to_status_id = null,
  statusnet_conversation_id = 'c1',
} = {}) => ({
  id,
  account: statusUser,
  name: 'status',
  content: text ?? `Text number ${id}`,
  uri: '',
  type,
  attentions: [],
  pleroma: {
    conversation_id: statusnet_conversation_id,
  },
  in_reply_to_id: in_reply_to_status_id,
})

export const mockUser = ({
  screen_name = userScreenName,
  id = userId,
  name = userName,
  url = userUrl,
} = {}) => ({
  _original: mockMastoAPIUser({
    screen_name,
    id,
    name,
    url,
  }),
  id,
  name,
  screen_name,
  url,
  relationship: undefined,
})

export const mockStatus = ({
  id = '1',
  text,
  type = 'status',
  statusUser = mockUser(),
  in_reply_to_status_id = null,
  statusnet_conversation_id = 'c1',
} = {}) => ({
  id,
  user: statusUser,
  name: 'status',
  text: text ?? `Text number ${id}`,
  uri: '',
  type,
  attentions: [],
  statusnet_conversation_id,
  emoji_reactions: [],
  in_reply_to_status_id,
})
