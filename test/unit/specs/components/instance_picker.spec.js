import { createTestingPinia } from '@pinia/testing'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { $t, mountOpts } from 'test/fixtures/setup_test.js'

import InstancePicker from 'src/components/instance_picker/instance_picker.vue'

import { chosenInstance, forgetInstance } from 'src/services/hosted/hosted.js'

const factory = (check) => {
  const done = vi.fn()
  const wrapper = mount(
    InstancePicker,
    mountOpts({ props: { check, onChosen: done } }),
  )
  return { wrapper, done }
}

describe('InstancePicker', () => {
  beforeEach(() => setActivePinia(createTestingPinia()))
  afterEach(() => forgetInstance())

  it('remembers an instance that answers and carries on', async () => {
    const check = vi.fn().mockResolvedValue(true)
    const { wrapper, done } = factory(check)
    await wrapper.find('input').setValue('@me@Pleroma.Example')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(check).toHaveBeenCalledWith('https://pleroma.example')
    expect(chosenInstance()).to.equal('https://pleroma.example')
    expect(done).toHaveBeenCalled()
  })

  it('says so when the instance cannot be reached from here', async () => {
    const check = vi.fn().mockResolvedValue(false)
    const { wrapper, done } = factory(check)
    await wrapper.find('input').setValue('gone.example')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).to.include($t('hosted.unreachable'))
    expect(chosenInstance()).to.equal(null)
    expect(done).not.toHaveBeenCalled()
  })

  it('asks for a domain when the input is not one', async () => {
    const check = vi.fn()
    const { wrapper } = factory(check)
    await wrapper.find('input').setValue('not a domain')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(check).not.toHaveBeenCalled()
    expect(wrapper.text()).to.include($t('hosted.not_a_domain'))
  })
})
