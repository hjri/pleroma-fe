import apiService from '../api/api.service.js'
import { promiseInterval } from '../promise_interval/promise_interval.js'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders.js'

const fetchAndUpdate = ({ credentials }) => {
  return apiService
    .fetchBookmarkFolders({ credentials })
    .then(
      (bookmarkFolders) => {
        useBookmarkFoldersStore().setBookmarkFolders(bookmarkFolders)
      },
      () => {},
    )
    .catch(() => {})
}

const startFetching = ({ credentials, store }) => {
  const boundFetchAndUpdate = () => fetchAndUpdate({ credentials, store })
  boundFetchAndUpdate()
  return promiseInterval(boundFetchAndUpdate, 240000)
}

const bookmarkFoldersFetcher = {
  startFetching,
}

export default bookmarkFoldersFetcher
