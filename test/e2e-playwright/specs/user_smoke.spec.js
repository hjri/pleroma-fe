import { randomUUID } from 'node:crypto'
import { expect, test } from 'playwright/test'

const createTestUser = () => {
  const id = randomUUID().slice(0, 8)
  return {
    username: `e2e_${id}`,
    fullname: `E2E ${id}`,
    email: `e2e_${id}@example.com`,
    password: 'e2e-password',
  }
}

const register = async (page, user) => {
  await page.goto('/registration')

  const registrationForm = page.locator('#main-scroller form.registration-form')
  await registrationForm.locator('#sign-up-username').fill(user.username)
  await registrationForm.locator('#sign-up-fullname').fill(user.fullname)
  await registrationForm.locator('#email').fill(user.email)
  await registrationForm.locator('#sign-up-password').fill(user.password)
  await registrationForm
    .locator('#sign-up-password-confirmation')
    .fill(user.password)
  await Promise.all([
    page.waitForURL(/\/main\/friends/),
    registrationForm.getByRole('button', { name: 'Register' }).click(),
  ])
}

const logout = async (page) => {
  await page.getByTitle('Log out').click()
  const confirmLogout = page.getByRole('button', {
    name: 'Logout',
    exact: true,
  })
  await expect(confirmLogout).toBeVisible()
  await confirmLogout.click()
  await page.waitForURL(/\/main\/(public|all)/)

  await expect(page.locator('#sidebar form.login-form')).toBeVisible()
}

const login = async (page, user) => {
  await page.goto('/login')

  const loginForm = page.locator('#main-scroller form.login-form')
  await loginForm.locator('#username').fill(user.username)
  await loginForm.locator('#password').fill(user.password)
  await loginForm.getByRole('button', { name: 'Log in' }).click()

  await page.waitForURL(/\/main\/friends/)
}

test('user can register, log out, and log back in', async ({ page }) => {
  const user = createTestUser()
  await register(page, user)
  console.debug('Register Success')
  await expect(page.getByTitle('Log out')).toBeVisible()

  await logout(page)
  console.debug('Logout Success')

  await login(page, user)
  console.debug('Login Success')
  await expect(page.getByTitle('Log out')).toBeVisible()
})

test('user can post a status', async ({ page }) => {
  const user = createTestUser()
  await register(page, user)

  const statusText = `Hello from ${user.username} (${randomUUID().slice(0, 8)})`
  const composer = page.locator('#sidebar .user-panel .post-status-form')
  await composer.locator('textarea.form-post-body').fill(statusText)
  await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' &&
        resp.url().includes('/api/v1/statuses') &&
        resp.ok(),
    ),
    composer.getByRole('button', { name: 'Post', exact: true }).click(),
  ])

  await page.goto(`/users/${user.username}`)
  await expect(page.getByText(statusText)).toBeVisible()
})
