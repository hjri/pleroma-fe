import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { nextTick } from 'vue'

import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import { $t, mountOpts, waitForEvent } from '../../../fixtures/setup_test'

import { useSyncConfigStore } from 'src/stores/sync_config.js'

const autoSaveOrNot = (caseFn, caseTitle, runFn) => {
  caseFn(`${caseTitle} with auto-save`, function () {
    return runFn.bind(this)(true)
  })

  caseFn(`${caseTitle} with no auto-save`, function () {
    return runFn.bind(this)(false)
  })
}

const saveManually = async (wrapper) => {
  const morePostActions = wrapper.findByText(
    'button',
    $t('post_status.more_post_actions'),
  )
  await morePostActions.trigger('click')

  const btn = wrapper.findByText(
    'button',
    $t('post_status.save_to_drafts_button'),
  )
  await btn.trigger('click')
}

const waitSaveTime = 4000

afterEach(() => {
  vi.useRealTimers()
})

describe('Draft saving', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia())
  })

  autoSaveOrNot(
    it,
    'should save when the button is clicked',
    async (autoSave) => {
      const wrapper = mount(PostStatusForm, mountOpts())
      const store = useSyncConfigStore()
      store.mergedConfig = {
        autoSaveDraft: autoSave,
      }
      expect(wrapper.vm.$store.getters.draftCount).to.equal(0)

      const textarea = wrapper.get('textarea')
      await textarea.setValue('mew mew')

      await saveManually(wrapper)
      expect(wrapper.vm.$store.getters.draftCount).to.equal(1)
      expect(wrapper.vm.$store.getters.draftsArray[0].status).to.equal(
        'mew mew',
      )
    },
  )

  it('should auto-save if it is enabled', async function () {
    vi.useFakeTimers()
    const wrapper = mount(PostStatusForm, mountOpts())
    const store = useSyncConfigStore()
    store.mergedConfig = {
      autoSaveDraft: true,
    }
    expect(wrapper.vm.$store.getters.draftCount).to.equal(0)
    const textarea = wrapper.get('textarea')
    await textarea.setValue('mew mew')

    expect(wrapper.vm.$store.getters.draftCount).to.equal(0)
    await vi.advanceTimersByTimeAsync(waitSaveTime)
    expect(wrapper.vm.$store.getters.draftCount).to.equal(1)
    expect(wrapper.vm.$store.getters.draftsArray[0].status).to.equal('mew mew')
  })

  it('should auto-save when close if auto-save is on', async () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          closeable: true,
        },
      }),
    )
    const store = useSyncConfigStore()
    store.mergedConfig = {
      autoSaveDraft: true,
    }
    expect(wrapper.vm.$store.getters.draftCount).to.equal(0)
    const textarea = wrapper.get('textarea')
    await textarea.setValue('mew mew')
    wrapper.vm.requestClose()
    expect(wrapper.vm.$store.getters.draftCount).to.equal(1)
    await waitForEvent(wrapper, 'can-close')
  })

  it('should save when close if auto-save is off, and unsavedPostAction is save', async () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          closeable: true,
        },
      }),
    )
    const store = useSyncConfigStore()
    store.mergedConfig = {
      autoSaveDraft: false,
      unsavedPostAction: 'save',
    }
    expect(wrapper.vm.$store.getters.draftCount).to.equal(0)
    const textarea = wrapper.get('textarea')
    await textarea.setValue('mew mew')
    wrapper.vm.requestClose()
    expect(wrapper.vm.$store.getters.draftCount).to.equal(1)
    await waitForEvent(wrapper, 'can-close')
  })

  it('should discard when close if auto-save is off, and unsavedPostAction is discard', async () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          closeable: true,
        },
      }),
    )
    const store = useSyncConfigStore()
    store.mergedConfig = {
      autoSaveDraft: false,
      unsavedPostAction: 'discard',
    }
    expect(wrapper.vm.$store.getters.draftCount).to.equal(0)
    const textarea = wrapper.get('textarea')
    await textarea.setValue('mew mew')
    wrapper.vm.requestClose()
    await waitForEvent(wrapper, 'can-close')
    expect(wrapper.vm.$store.getters.draftCount).to.equal(0)
  })

  it('should confirm when close if auto-save is off, and unsavedPostAction is confirm', async () => {
    const wrapper = mount(
      PostStatusForm,
      mountOpts({
        props: {
          closeable: true,
        },
      }),
    )
    const store = useSyncConfigStore(createTestingPinia())
    store.mergedConfig = {
      autoSaveDraft: false,
      unsavedPostAction: 'confirm',
    }
    expect(wrapper.vm.$store.getters.draftCount).to.equal(0)
    const textarea = wrapper.get('textarea')
    await textarea.setValue('mew mew')
    wrapper.vm.requestClose()
    await nextTick()
    const saveButton = wrapper.findByText(
      'button',
      $t('post_status.close_confirm_save_button'),
    )
    expect(saveButton).to.be.ok
    await saveButton.trigger('click')
    console.info('clicked')
    expect(wrapper.vm.$store.getters.draftCount).to.equal(1)
    await flushPromises()
    await waitForEvent(wrapper, 'can-close')
  })
})
