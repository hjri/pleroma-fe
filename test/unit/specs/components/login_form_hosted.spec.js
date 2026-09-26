import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { $t, mountOpts } from 'test/fixtures/setup_test.js'

import LoginForm from 'src/components/login_form/login_form.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'

import {
  chooseInstance,
  chosenInstance,
  forgetInstance,
} from 'src/services/hosted/hosted.js'

describe('LoginForm on the hosted site', () => {
  beforeEach(() => setActivePinia(createTestingPinia({ stubActions: false })))
  afterEach(() => forgetInstance())

  const render = (hosted) => {
    const instance = useInstanceStore()
    instance.hosted = hosted
    instance.server = 'https://pleroma.example'
    const reloadPage = vi.fn()
    const wrapper = mount(
      LoginForm,
      mountOpts({ global: { provide: { reloadPage } } }),
    )
    return { wrapper, reloadPage }
  }

  it('names the instance and offers to change it', async () => {
    chooseInstance('https://pleroma.example')
    const oauth = useOAuthStore()
    oauth.clientId = 'id'
    oauth.clientSecret = 'secret'
    oauth.userToken = 'token-of-the-old-instance'
    const { wrapper, reloadPage } = render(true)
    expect(wrapper.text()).to.include('pleroma.example')
    await wrapper.findByText('button', $t('hosted.change')).trigger('click')
    expect(chosenInstance()).to.equal(null)
    // that app was registered with the old instance
    expect(oauth.clientId).to.not.equal('id')
    // never sent to the next instance
    expect(oauth.userToken).to.not.equal('token-of-the-old-instance')
    expect(reloadPage).toHaveBeenCalled()
  })

  it('offers no instance change on an instance', () => {
    const { wrapper } = render(false)
    expect(wrapper.text()).to.not.include($t('hosted.change'))
  })
})
