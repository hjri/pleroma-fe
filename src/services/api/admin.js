import { promisedRequest } from './helpers.js'

import { RegistrationError, StatusCodeError } from 'src/services/errors/errors'

const REPORTS = '/api/v1/pleroma/admin/reports'
const CONFIG_URL = '/api/v1/pleroma/admin/config'
const DESCRIPTIONS_URL = '/api/v1/pleroma/admin/config/descriptions'

const ANNOUNCEMENTS_URL = (id) => '/api/v1/pleroma/admin/announcements/${id}'

const FRONTENDS_URL = '/api/v1/pleroma/admin/frontends'
const FRONTENDS_INSTALL_URL = '/api/v1/pleroma/admin/frontends/install'

const USERS_URL = (nickname) => `/api/v1/pleroma/admin/users/${nickname}`
const USERS_URL_LIST = ({
  page,
  pageSize,
  filters = {},
  query = '',
  name = '',
  email = '',
}) => {
  const {
    local = false,
    external = false,
    active = false,
    needApproval = false,
    unconfirmed = false,
    deactivated = false,
    isAdmin = true,
    isModerator = true,
  } = filters
  const filters_str = [
    local && 'local',
    external && 'external',
    active && 'active',
    needApproval && 'need_approval',
    unconfirmed && 'unconfirmed',
    deactivated && 'deactivated',
    isAdmin && 'is_admin',
    isModerator && 'is_moderator',
  ]
    .filter((x) => x)
    .join(',')
  return `/api/v1/pleroma/admin/users?page=${page}&page_size=${pageSize}&filters=${filters_str}&query=${query}&name=${name}&email=${email}`
}

const TAG_USER_URL = '/api/pleroma/admin/users/tag'

const PERMISSION_GROUP_URL = (right) =>
  `/api/pleroma/admin/users/permission_group/${right}`
const ACTIVATE_USERS_URL = '/api/pleroma/admin/users/activate'
const DEACTIVATE_USERS_URL = '/api/pleroma/admin/users/deactivate'
const SUGGEST_USERS_URL = '/api/pleroma/admin/users/suggest'
const UNSUGGEST_USERS_URL = '/api/pleroma/admin/users/unsuggest'
const APPROVE_USERS_URL = '/api/v1/pleroma/admin/users/approve'
const CONFIRM_USERS_URL = '/api/v1/pleroma/admin/users/confirm_email'
const RESEND_CONFIRMATION_EMAIL_URL =
  '/api/v1/pleroma/admin/users/resend_confirmation_email'
const LIST_STATUSES_URL = ({ id, page, pageSize, godmode, withReblogs }) =>
  `/api/v1/pleroma/admin/users/${id}/statuses?page_size=${pageSize}&page=${page}&godmode=${godmode}&with_reblogs=${withReblogs}`
const CHANGE_STATUS_SCOPE_URL = (id) => `/api/v1/pleroma/admin/statuses/${id}`
const REQUIRE_PASSWORD_CHANGE_URL =
  '/api/v1/pleroma/admin/users/force_password_reset'

const DISABLE_MFA_URL = '/api/v1/pleroma/admin/users/disable_mfa'
const EMOJI_RELOAD_URL = '/api/pleroma/admin/reload_emoji'
const EMOJI_IMPORT_FS_URL = '/api/pleroma/emoji/packs/import'
const EMOJI_PACKS_URL = (page, pageSize) =>
  `/api/v1/pleroma/emoji/packs?page=${page}&page_size=${pageSize}`
const EMOJI_PACK_URL = (name) => `/api/v1/pleroma/emoji/pack?name=${name}`
const EMOJI_PACKS_DL_REMOTE_URL = '/api/v1/pleroma/emoji/packs/download'
const EMOJI_PACKS_DL_REMOTE_ZIP_URL = '/api/v1/pleroma/emoji/packs/download_zip'
const EMOJI_PACKS_LS_REMOTE_URL = (url, page, pageSize) =>
  `/api/v1/pleroma/emoji/packs/remote?url=${url}&page=${page}&page_size=${pageSize}`
const EMOJI_UPDATE_FILE_URL = (name) =>
  `/api/v1/pleroma/emoji/packs/files?name=${name}`

//

export const setUsersTags = ({
  tags,
  credentials,
  value,
  screen_names: nicknames,
}) =>
  promisedRequest({
    url: TAG_USER_URL,
    method: value ? 'PUT' : 'DELETE',
    credentials,
    payload: {
      nicknames,
      tags,
    },
  })

export const setUsersRight = ({
  right,
  credentials,
  value,
  screen_names: nicknames,
}) =>
  promisedRequest({
    url: PERMISSION_GROUP_URL(right),
    method: value ? 'POST' : 'DELETE',
    credentials,
    payload: {
      nicknames,
    },
  })

export const setUsersActivationStatus = ({
  credentials,
  screen_names: nicknames,
  value,
}) =>
  promisedRequest({
    url: value ? ACTIVATE_USERS_URL : DEACTIVATE_USERS_URL,
    method: 'PATCH',
    credentials,
    payload: {
      nicknames,
    },
  }).then((response) => response.users)

export const setUsersApprovalStatus = ({
  credentials,
  screen_names: nicknames,
}) =>
  promisedRequest({
    url: APPROVE_USERS_URL,
    method: 'PATCH',
    credentials,
    payload: {
      nicknames,
    },
  }).then((response) => response.users)

export const setUsersConfirmationStatus = ({
  credentials,
  screen_names: nicknames,
}) =>
  promisedRequest({
    url: CONFIRM_USERS_URL,
    method: 'PATCH',
    credentials,
    payload: {
      nicknames,
    },
  }).then((response) => response.users)

export const setUsersSuggestionStatus = ({
  credentials,
  screen_names: nicknames,
  value,
}) =>
  promisedRequest({
    url: value ? SUGGEST_USERS_URL : UNSUGGEST_USERS_URL,
    method: 'PATCH',
    credentials,
    payload: {
      nicknames,
    },
  }).then((response) => response.users)

export const getUserData = ({ credentials, screen_name: nickname }) =>
  promisedRequest({
    url: USERS_URL(nickname),
    method: 'GET',
    credentials,
  })

export const deleteAccounts = ({ credentials, screen_names: nicknames }) =>
  promisedRequest({
    url: USERS_URL(),
    method: 'DELETE',
    credentials,
    payload: {
      nicknames,
    },
  })

export const getAnnouncements = ({ credentials }) =>
  promisedRequest({ url: ANNOUNCEMENTS_URL(), credentials })

// the reported list is hardly useful because standards are for dating i guess,
// so make sure to fetchIfMissing right afterward using this call
export const listUsers = ({ opts, credentials }) =>
  promisedRequest({
    url: USERS_URL_LIST(opts),
    credentials,
    method: 'GET',
  })

export const resendConfirmationEmail = ({
  screen_names: nicknames,
  credentials,
}) =>
  promisedRequest({
    url: RESEND_CONFIRMATION_EMAIL_URL,
    credentials,
    method: 'PATCH',
    payload: {
      nicknames,
    },
  })

export const requirePasswordChange = ({
  screen_names: nicknames,
  credentials,
}) =>
  promisedRequest({
    url: REQUIRE_PASSWORD_CHANGE_URL,
    credentials,
    method: 'PATCH',
    payload: {
      nicknames,
    },
  })

export const disableMFA = ({ screen_name: nickname, credentials }) =>
  promisedRequest({
    url: DISABLE_MFA_URL,
    credentials,
    method: 'PUT',
    payload: {
      nickname,
    },
  })

export const listStatuses = ({ opts, credentials }) =>
  promisedRequest({
    url: LIST_STATUSES_URL(opts),
    credentials,
    method: 'GET',
  })

export const changeStatusScope = ({
  opts: { id, sensitive, visibility },
  credentials,
}) => {
  var payload = {}
  if (typeof sensitive !== 'undefined') {
    payload['sensitive'] = sensitive
  }
  if (typeof visibility !== 'undefined') {
    payload['visibility'] = visibility
  }

  return promisedRequest({
    url: CHANGE_STATUS_SCOPE_URL(id),
    credentials,
    method: 'PUT',
    payload,
  })
}

export const announcementToPayload = ({
  content,
  startsAt,
  endsAt,
  allDay,
}) => {
  const payload = { content }

  if (typeof startsAt !== 'undefined') {
    payload.starts_at = startsAt ? new Date(startsAt).toISOString() : null
  }

  if (typeof endsAt !== 'undefined') {
    payload.ends_at = endsAt ? new Date(endsAt).toISOString() : null
  }

  if (typeof allDay !== 'undefined') {
    payload.all_day = allDay
  }

  return payload
}

export const postAnnouncement = ({
  credentials,
  content,
  startsAt,
  endsAt,
  allDay,
}) =>
  promisedRequest({
    url: ANNOUNCEMENTS_URL(),
    credentials,
    method: 'POST',
    payload: announcementToPayload({ content, startsAt, endsAt, allDay }),
  })

export const editAnnouncement = ({
  id,
  credentials,
  content,
  startsAt,
  endsAt,
  allDay,
}) =>
  promisedRequest({
    url: ANNOUNCEMENTS_URL(id),
    credentials,
    method: 'PATCH',
    payload: announcementToPayload({ content, startsAt, endsAt, allDay }),
  })

export const deleteAnnouncement = ({ id, credentials }) =>
  promisedRequest({
    url: ANNOUNCEMENTS_URL(id),
    credentials,
    method: 'DELETE',
  })

export const setReportState = ({ id, state, credentials }) => {
  // TODO: Can't use promisedRequest because on OK this does not return json
  // See https://git.pleroma.social/pleroma/pleroma-fe/-/merge_requests/1322

  return promisedRequest({
    url: REPORTS,
    credentials,
    method: 'PATCH',
    payload: {
      reports: [
        {
          id,
          state,
        },
      ],
    },
  })
    .then((data) => {
      if (data.status >= 500) {
        throw Error(data.statusText)
      } else if (data.status >= 400) {
        return data.json()
      }
      return data
    })
    .then((data) => {
      if (data.errors) {
        throw Error(data.errors[0].message)
      }
    })
}

export const getInstanceDBConfig = ({ credentials }) =>
  get({
    url: CONFIG_URL,
    credentials,
  })

export const getInstanceConfigDescriptions = ({ credentials }) =>
  get({
    url: DESCRIPTIONS_URL,
    credentials,
  })

export const getAvailableFrontends = ({ credentials }) =>
  promisedRequest({
    url: FRONTENDS_URL,
    credentials,
  })

export const pushInstanceDBConfig = ({ credentials, payload }) =>
  promisedRequest({
    url: CONFIG_URL,
    method: 'POST',
    credentials,
    payload,
  })

export const installFrontend = ({ credentials, payload }) =>
  promisedRequest({
    url: FRONTENDS_INSTALL_URL,
    credentials,
    method: 'POST',
    payload,
  })

// Emoji packs
export const deleteEmojiPack = ({ name }) =>
  promisedRequest({
    url: EMOJI_PACK_URL(name),
    method: 'DELETE',
  })

export const reloadEmoji = ({ credentials }) =>
  promisedRequest({
    url: EMOJI_RELOAD_URL,
    method: 'POST',
    credentials,
  })

export const importEmojiFromFS = ({ credentials }) =>
  promisedRequest({
    url: EMOJI_IMPORT_FS_URL,
    credentials,
  })

export const createEmojiPack = ({ name, credentials }) =>
  promisedRequest({
    url: EMOJI_PACK_URL(name),
    method: 'POST',
    credentials,
  })

export const listEmojiPacks = ({ page, pageSize, credentials }) =>
  promisedRequest({
    url: EMOJI_PACKS_URL(page, pageSize),
  })

export const listRemoteEmojiPacks = ({
  instance,
  page,
  pageSize,
  credentials,
}) => {
  if (!instance.startsWith('http')) {
    instance = 'https://' + instance
  }

  return promisedRequest({
    url: EMOJI_PACKS_LS_REMOTE_URL(instance, page, pageSize),
    credentials,
  })
}

export const downloadRemoteEmojiPack = ({
  instance,
  packName,
  as,
  credentials,
}) =>
  promisedRequest({
    url: EMOJI_PACKS_DL_REMOTE_URL,
    credentials,
    method: 'POST',
    payload: {
      url: instance,
      name: packName,
      as,
    },
  })

export const downloadRemoteEmojiPackZIP = ({
  url,
  packName,
  file,
  credentials,
}) => {
  const data = new FormData()
  if (file) data.set('file', file)
  if (url) data.set('url', url)
  data.set('name', packName)

  return promisedRequest({
    url: EMOJI_PACKS_DL_REMOTE_ZIP_URL,
    method: 'POST',
    payload: data,
  })
}

export const saveEmojiPackMetadata = ({ name, newData, credentials }) =>
  promisedRequest({
    url: EMOJI_PACK_URL(name),
    credentials,
    method: 'PATCH',
    payload: { metadata: newData },
  })

export const addNewEmojiFile = ({ packName, file, shortcode, filename }) => {
  const data = new FormData()
  if (filename.trim() !== '') {
    data.set('filename', filename)
  }
  if (shortcode.trim() !== '') {
    data.set('shortcode', shortcode)
  }
  data.set('file', file)

  return promisedRequest({
    url: EMOJI_UPDATE_FILE_URL(packName),
    method: 'POST',
    payload: data,
  })
}

export const updateEmojiFile = ({
  packName,
  shortcode,
  newShortcode,
  newFilename,
  credentials,
  force,
}) =>
  promisedRequest({
    url: EMOJI_UPDATE_FILE_URL(packName),
    credentials,
    method: 'PATCH',
    payload: {
      shortcode,
      new_shortcode: newShortcode,
      new_filename: newFilename,
      force,
    },
  })

export const deleteEmojiFile = ({ packName, shortcode }) =>
  promisedRequest({
    url: `${EMOJI_UPDATE_FILE_URL(packName)}&shortcode=${shortcode}`,
    method: 'DELETE',
  })
