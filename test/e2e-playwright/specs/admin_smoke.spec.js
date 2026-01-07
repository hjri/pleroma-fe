/* global process */
import { test, expect } from 'playwright/test'

const adminUsername = process.env.E2E_ADMIN_USERNAME || 'admin'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'adminadmin'

test('admin can open the admin settings modal', async ({ page }) => {
  await page.goto('/login')

  const loginForm = page.locator('#main-scroller form.login-form')
  await loginForm.locator('#username').fill(adminUsername)
  await loginForm.locator('#password').fill(adminPassword)
  await loginForm.getByRole('button', { name: 'Log in' }).click()

  await page.waitForURL(/\/main\/friends/)

  await expect(page.getByTitle('Administration')).toBeVisible()
  await page.getByTitle('Administration').click()

  const modal = page.locator('.settings-modal-panel')
  await expect(modal.getByRole('heading', { name: 'Administration' })).toBeVisible()

  await modal.getByRole('tab', { name: 'Emoji' }).click()
  await expect(modal.getByText('Emoji packs')).toBeVisible()
})
