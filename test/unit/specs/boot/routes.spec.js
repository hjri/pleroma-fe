import { createTestingPinia } from '@pinia/testing'

createTestingPinia()

import { createMemoryHistory, createRouter } from 'vue-router'

import getRoutes from 'src/boot/routes.js'

describe('routes', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: getRoutes(),
  })

  it('root path', async () => {
    await router.push('/main/all')

    const matchedComponents = router.currentRoute.value.matched

    expect(matchedComponents[0].components.default.__file).to.contain(
      '/timeline.vue',
    )
  })

  it("user's profile", async () => {
    await router.push('/fake-user-name')

    const matchedComponents = router.currentRoute.value.matched

    expect(matchedComponents[0].components.default.__file).to.contain(
      '/user_profile.vue',
    )
  })

  it("user's profile at /users", async () => {
    await router.push('/users/fake-user-name')

    const matchedComponents = router.currentRoute.value.matched

    expect(matchedComponents[0].components.default.__file).to.contain(
      '/user_profile.vue',
    )
  })

  it('list view', async () => {
    await router.push('/lists')

    const matchedComponents = router.currentRoute.value.matched
    expect(matchedComponents[0].components.default.__file).to.contain(
      '/lists.vue',
    )
  })

  it('list timeline', async () => {
    await router.push('/lists/1')

    const matchedComponents = router.currentRoute.value.matched

    expect(matchedComponents[0].components.default.__file).to.contain(
      '/timeline.vue',
    )
  })

  it('list edit', async () => {
    await router.push('/lists/1/edit')

    const matchedComponents = router.currentRoute.value.matched

    expect(matchedComponents[0].components.default.__file).to.contain(
      '/lists_edit.vue',
    )
  })
})
