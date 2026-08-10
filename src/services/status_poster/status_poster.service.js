import { map } from 'lodash'

import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import {
  editStatus as apiEditStatus,
  postStatus as apiPostStatus,
  setMediaDescription as apiSetMediaDescription,
  uploadMedia as apiUploadMedia,
} from 'src/api/user.js'

const postStatus = ({
  store,
  status,
  spoilerText,
  visibility,
  sensitive,
  poll,
  media = [],
  inReplyToStatusId = undefined,
  quoteId = undefined,
  contentType = 'text/plain',
  preview = false,
  idempotencyKey = '',
}) => {
  const mediaIds = map(media, 'id')

  return apiPostStatus({
    credentials: useUsersStore().currentUser.credentials,
    status,
    spoilerText,
    visibility,
    sensitive,
    mediaIds,
    inReplyToStatusId,
    quoteId,
    contentType,
    poll,
    preview,
    idempotencyKey,
  }).then(({ data, timestamp }) => {
    if (!preview)
      useStatusesStore().addNewStatuses({
        timestamp,
        statuses: [data],
        timeline: 'friends',
        showImmediately: true,
        noIdUpdate: true, // To prevent missing notices on next pull.
      })

    return data
  })
}

const editStatus = ({
  store,
  statusId,
  status,
  spoilerText,
  sensitive,
  poll,
  media = [],
  contentType = 'text/plain',
}) => {
  const mediaIds = map(media, 'id')

  return apiEditStatus({
    id: statusId,
    credentials: useUsersStore().currentUser.credentials,
    status,
    spoilerText,
    sensitive,
    poll,
    mediaIds,
    contentType,
  })
    .then(({ data }) => {
      store.dispatch('addNewStatuses', {
        statuses: [data],
        timeline: 'friends',
        showImmediately: true,
        noIdUpdate: true, // To prevent missing notices on next pull.
      })

      return data
    })
    .catch((err) => {
      console.error('Error editing status', err)
      return {
        error: err.message,
      }
    })
}

const uploadMedia = ({ store, formData }) => {
  const credentials = useUsersStore().currentUser.credentials
  return apiUploadMedia({ credentials, formData }).then(({ data }) => data)
}

const setMediaDescription = ({ store, id, description }) => {
  const credentials = useUsersStore().currentUser.credentials
  return apiSetMediaDescription({ credentials, id, description }).then(
    ({ data }) => data,
  )
}

const statusPosterService = {
  postStatus,
  editStatus,
  uploadMedia,
  setMediaDescription,
}

export default statusPosterService
