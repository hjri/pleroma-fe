import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'

import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import { mountOpts } from '../../../fixtures/setup_test'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'

const currentUser = {
  id: 'current-user',
  default_scope: 'public',
  locked: false,
}

const repliedUser = {
  id: 'replied-user',
  screen_name: 'replied',
}

const repliedStatus = {
  id: 'status-1',
  visibility: 'public',
  user: repliedUser,
}

const replyMountOpts = () =>
  mountOpts({
    props: {
      replyTo: repliedStatus.id,
      repliedUser,
      attentions: [],
      copyMessageScope: repliedStatus.visibility,
      disableDraft: true,
    },
    afterStore(store) {
      store.state.users.currentUser = currentUser
      store.state.statuses.allStatusesObject = {
        [repliedStatus.id]: repliedStatus,
      }
    },
  })

describe('PostStatusForm', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia())
  })

  it('initializes a reply form when quoteReply is unset', () => {
    useInstanceCapabilitiesStore().quotingAvailable = true

    const wrapper = mount(PostStatusForm, replyMountOpts())

    expect(wrapper.vm.newStatus.type).to.equal('reply')
    expect(wrapper.vm.newStatus.quote).to.eql({
      id: '',
      url: '',
      thread: false,
    })
  })
})
