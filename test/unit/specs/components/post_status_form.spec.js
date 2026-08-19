import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { vi } from 'vitest'

import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import { mountOpts } from '../../../fixtures/setup_test'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

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

const repliedStatus2 = {
  id: 'status-2',
  visibility: 'private',
  summary: 'subject',
  user: repliedUser,
}

describe('PostStatusForm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createTestingPinia())
    useUsersStore().currentUser = currentUser
    useStatusesStore().allStatuses = new Map([
      [repliedStatus.id, repliedStatus],
    ])
  })

  it('Clean empty initial state', () => {
    const wrapper = mount(PostStatusForm, mountOpts())

    expect(wrapper.vm.statusType).to.equal('new')
    expect(wrapper.vm.newStatus.spoilerText).to.eql('')
    expect(wrapper.vm.newStatus.mentions).to.eql('')
    expect(wrapper.vm.newStatus.status).to.eql('')
  })

  it('Reset cleans form to pristine state equal to state form was when created', () => {
    const wrapper = mount(PostStatusForm, mountOpts())

    const initial = { ...wrapper.vm.newStatus }
    wrapper.vm.clearStatus()

    expect(wrapper.vm.newStatus).to.eql(initial)
  })

  it('Initializes a reply form', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          repliedStatus: repliedStatus,
        },
      }),
    )

    useInstanceCapabilitiesStore().quotingAvailable = true

    expect(wrapper.vm.statusType).to.equal('reply')
    expect(wrapper.vm.isReply).to.equal(true)
    expect(wrapper.vm.refId).to.equal('status-1')
    expect(wrapper.vm.quotable).to.equal(true)
    expect(wrapper.vm.inReplyToStatusId).to.equal('status-1')
    expect(wrapper.vm.newStatus.quote).to.be.null
    expect(wrapper.vm.newStatus.poll).to.be.null
    expect(wrapper.vm.newStatus.spoilerText).to.eql('')
    expect(wrapper.vm.newStatus.mentions).to.eql('@replied')
    expect(wrapper.vm.newStatus.status).to.eql('@replied ')
    expect(wrapper.vm.newStatus.visibility).to.eql('public')
  })

  it('Copies scope and subject line, disables quoting for locked posts', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          repliedStatus: repliedStatus2,
        },
      }),
    )

    useInstanceCapabilitiesStore().quotingAvailable = true

    expect(wrapper.vm.statusType).to.equal('reply')
    expect(wrapper.vm.isReply).to.equal(true)
    expect(wrapper.vm.quotable).to.equal(false)
    expect(wrapper.vm.newStatus.quote).to.be.null
    expect(wrapper.vm.newStatus.poll).to.be.null
    expect(wrapper.vm.newStatus.spoilerText).to.eql('re: subject')
    expect(wrapper.vm.newStatus.mentions).to.eql('@replied')
    expect(wrapper.vm.newStatus.status).to.eql('@replied ')
    expect(wrapper.vm.newStatus.visibility).to.eql('private')

    expect(wrapper.vm.postingOptions.status).to.eql('@replied ')
    expect(wrapper.vm.postingOptions.spoilerText).to.eql('re: subject')
    expect(wrapper.vm.postingOptions.visibility).to.eql('private')
    expect(wrapper.vm.postingOptions.sensitive).to.eql(false)
    expect(wrapper.vm.postingOptions.media).to.eql([])
    expect(wrapper.vm.postingOptions.inReplyToStatusId).to.eql('status-2')
    expect(wrapper.vm.postingOptions.quoteId).to.be.null
    expect(wrapper.vm.postingOptions.contentType).to.eql('text/plain')
    expect(wrapper.vm.postingOptions.poll).to.be.null
  })

  it('Forces direct mode when replying to a DM, mastodon style subject handling', () => {
    // We need to initialize pinia first which is happening here...
    const options = mountOpts({
      props: {
        repliedStatus: { ...repliedStatus2, visibility: 'direct' },
      },
    })

    // ...set our settings...
    useMergedConfigStore().mergedConfig = {
      ...useMergedConfigStore().mergedConfig,
      subjectLineBehavior: 'masto',
    }

    // ...and only then mount our component
    const wrapper = mount(PostStatusForm, options)

    // Otherwise we get multiple instances of pinia that don't talk to each other

    expect(wrapper.vm.statusType).to.equal('reply')
    expect(wrapper.vm.isReply).to.equal(true)
    expect(wrapper.vm.quotable).to.equal(false)
    expect(wrapper.vm.newStatus.quote).to.be.null
    expect(wrapper.vm.newStatus.poll).to.be.null
    expect(wrapper.vm.newStatus.spoilerText).to.eql('subject')
    expect(wrapper.vm.newStatus.mentions).to.eql('@replied')
    expect(wrapper.vm.newStatus.status).to.eql('@replied ')
    expect(wrapper.vm.newStatus.visibility).to.eql('direct')
  })

  it('Sets status to statusText without mentions if mentions line is enabled', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          repliedStatus: repliedStatus2,
          statusText: 'testing',
          mentionsLine: true,
        },
      }),
    )

    expect(wrapper.vm.statusType).to.equal('reply')
    expect(wrapper.vm.isReply).to.equal(true)
    expect(wrapper.vm.newStatus.mentions).to.eql('@replied')
    expect(wrapper.vm.newStatus.status).to.eql('testing')
  })

  it('Sets mention when asked for it', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          profileMention: repliedUser,
        },
      }),
    )

    expect(wrapper.vm.statusType).to.equal('mention')
    expect(wrapper.vm.isReply).to.equal(false)
    expect(wrapper.vm.newStatus.mentions).to.eql('@replied')
    expect(wrapper.vm.newStatus.status).to.eql('@replied ')
  })

  it('Initializes quote when reply/quote toggled to quote', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          repliedStatus: repliedStatus2,
        },
      }),
    )

    expect(wrapper.vm.statusType).to.equal('reply')
    expect(wrapper.vm.isReply).to.equal(true)

    wrapper.vm.quoteThreadToggled = true

    expect(wrapper.vm.newStatus.quote).to.eql({ thread: true, id: 'status-2' })
  })

  it('Resets quote when reply/quote toggled to reply', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          repliedStatus: repliedStatus2,
        },
      }),
    )

    expect(wrapper.vm.statusType).to.equal('reply')
    expect(wrapper.vm.isReply).to.equal(true)

    wrapper.vm.quoteThreadToggled = true
    wrapper.vm.quoteThreadToggled = false

    expect(wrapper.vm.newStatus.quote).to.be.null
  })

  it('Initializes and reset quote when toggling quote attachment', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          repliedStatus: repliedStatus2,
        },
      }),
    )

    expect(wrapper.vm.statusType).to.equal('reply')
    expect(wrapper.vm.isReply).to.equal(true)

    wrapper.vm.toggleQuoteForm()
    expect(wrapper.vm.newStatus.quote).to.eql({
      thread: false,
      id: null,
      url: '',
    })
    wrapper.vm.toggleQuoteForm()
    expect(wrapper.vm.newStatus.quote).to.be.null
  })

  it('Status editing', () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          statusId: 'edited',
          statusText: 'text',
          statusSubject: 'heading',
          statusIsSensitive: true,
          statusPoll: {},
          statusQuote: {},
          statusFiles: [],
          statusMediaDescriptions: {},
          statusVisibility: 'unlisted',
          statusContentType: 'text/markdown',
        },
      }),
    )

    expect(wrapper.vm.statusType).to.equal('edit')
    expect(wrapper.vm.isReply).to.equal(false) // edits don't support changing reply-to so it's pretty much ignored
    expect(wrapper.vm.isEdit).to.equal(true)
    expect(wrapper.vm.newStatus.quote).to.eql({})
    expect(wrapper.vm.newStatus.poll).to.eql({})
    expect(wrapper.vm.newStatus.spoilerText).to.eql('heading')
    expect(wrapper.vm.newStatus.mentions).to.eql('')
    expect(wrapper.vm.newStatus.status).to.eql('text')
    expect(wrapper.vm.newStatus.visibility).to.eql('unlisted')
    expect(wrapper.vm.newStatus.contentType).to.eql('text/markdown')
    expect(wrapper.vm.newStatus.nsfw).to.equal(true)
    expect(wrapper.vm.newStatus.files).to.eql([])
  })

  it('Posting should reset idempotency key', async () => {
    vi.setSystemTime(new Date(2027, 1, 1, 13))
    const wrapper = mount(PostStatusForm, mountOpts())
    const oldIdempotency = wrapper.vm.idempotencyKey

    vi.setSystemTime(new Date(2028, 1, 1, 13))

    wrapper.vm.newStatus.status = 'Testing'
    await wrapper.vm.postStatus()

    expect(wrapper.vm.idempotencyKey).to.not.eql(oldIdempotency)
  })

  // TODO Probably better to separate attachment upload/manipulation into its own component?
  // we need to upload-on-submit for compression setting anyway
  it('Attachments manipulations (moving, adding, removing)', () => {
    const wrapper = mount(PostStatusForm, mountOpts())

    const i1 = { id: '1', url: 'a' }
    const i2 = { id: '2', url: 'b' }
    const i3 = { id: '3', url: 'c' }
    const i4 = { id: '4', url: 'd' }
    const iX = { id: 'x', url: 'x' }

    wrapper.vm.newStatus.files = [i3, i1, iX, i2]

    wrapper.vm.removeMediaFile(iX)
    expect(wrapper.vm.newStatus.files).to.eql([i3, i1, i2])

    wrapper.vm.shiftUpMediaFile(i1)
    expect(wrapper.vm.newStatus.files).to.eql([i1, i3, i2])

    wrapper.vm.shiftUpMediaFile(i1) // should ignore
    expect(wrapper.vm.newStatus.files).to.eql([i1, i3, i2])

    wrapper.vm.shiftDnMediaFile(i3)
    expect(wrapper.vm.newStatus.files).to.eql([i1, i2, i3])

    wrapper.vm.shiftDnMediaFile(i3) // should ignore
    expect(wrapper.vm.newStatus.files).to.eql([i1, i2, i3])

    wrapper.vm.addMediaFile(i4)
    expect(wrapper.vm.newStatus.files).to.eql([i1, i2, i3, i4])
  })

  it('Attachment descriptions', () => {
    const wrapper = mount(PostStatusForm, mountOpts())

    const i1 = { id: '1', url: 'a' }

    wrapper.vm.addMediaFile(i1)
    expect(wrapper.vm.newStatus.files).to.eql([i1])

    wrapper.vm.editAttachment(i1, 'description')
    expect(wrapper.vm.newStatus.mediaDescriptions['1']).to.eql('description')
  })
  // TODO: Drafts (needs vuex to pinia migration)
})
