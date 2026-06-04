import { createTestingPinia } from '@pinia/testing'

createTestingPinia()

import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'

import routes from 'src/boot/routes'

const store = createStore({
  state: {
    instance: {},
  },
})

describe('routes', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: routes(store),
  })

  it('root path', async () => {
    await router.push('/main/all')

    const matchedComponents = router.currentRoute.value.matched

    expect(
      Object.hasOwn(
        matchedComponents[0].components.default.components,
        'Timeline',
      ),
    ).to.eql(true)
  })

  it("user's profile", async () => {
    await router.push('/fake-user-name')

    const matchedComponents = router.currentRoute.value.matched

    expect(
      matchedComponents[0].components.default.name,
    ).to.eql('AsyncComponentWrapper')

  })

  it("user's profile at /users", async () => {
    await router.push('/users/fake-user-name')

    const matchedComponents = router.currentRoute.value.matched

    expect(
      matchedComponents[0].components.default.name,
    ).to.eql('AsyncComponentWrapper')
  })

  it('list view', async () => {
    await router.push('/lists')

    const matchedComponents = router.currentRoute.value.matched

    expect(
      matchedComponents[0].components.default.name,
    ).to.eql('AsyncComponentWrapper')
  })

  it('list timeline', async () => {
    await router.push('/lists/1')

    const matchedComponents = router.currentRoute.value.matched

    expect(
      matchedComponents[0].components.default.name,
    ).to.eql('AsyncComponentWrapper')
  })

  it('list edit', async () => {
    await router.push('/lists/1/edit')

    const matchedComponents = router.currentRoute.value.matched

    expect(
      matchedComponents[0].components.default.name,
    ).to.eql('AsyncComponentWrapper')
  })
})
