import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { mountOpts } from 'test/fixtures/setup_test.js'

import PollForm from 'src/components/poll/poll_form.vue'

import { useInstanceStore } from 'src/stores/instance.js'

import { pollFormToMasto } from 'src/services/poll/poll.service.js'

// The form inside a parent that keeps the poll, as the post form does: the
// prop only catches up on the parent's next render.
const Parent = {
  components: { PollForm },
  data: () => ({ poll: {} }),
  template: '<PollForm v-model="poll" :visible="true" />',
}

const make = () => {
  const pinia = createTestingPinia({ stubActions: false })
  useInstanceStore().limits.pollLimits = {
    max_options: 4,
    max_option_chars: 50,
    min_expiration: 60,
    max_expiration: 30 * 86400,
  }
  return mount(Parent, mountOpts({ global: { plugins: [pinia] } }))
}

describe('PollForm expiry', () => {
  it('keeps a chosen unit of days (it went back to minutes)', async () => {
    const wrapper = make()
    await wrapper.get('.expiry-unit select').setValue('days')
    await wrapper.get('.expiry-amount').setValue('1')
    expect(wrapper.vm.poll).to.include({ expiryUnit: 'days' })
    expect(Number(wrapper.vm.poll.expiryAmount)).to.equal(1)
    wrapper.vm.poll.options = ['a', 'b']
    expect(pollFormToMasto(wrapper.vm.poll).expiresIn).to.equal(86400)
  })

  it('keeps the amount within the limits in the chosen unit', async () => {
    const wrapper = make()
    await wrapper.get('.expiry-unit select').setValue('days')
    await wrapper.get('.expiry-amount').setValue('90')
    expect(wrapper.vm.poll).to.include({ expiryUnit: 'days', expiryAmount: 30 })
  })
})
