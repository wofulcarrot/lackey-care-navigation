import { test, expect } from '@playwright/test'

test('emergency symptom check triggers 911 alert', async ({ page }) => {
  await page.goto('/en/emergency')
  await page.getByRole('button', { name: /chest pain/i }).first().click()
  await page.getByRole('button', { name: /check|submit|continue/i }).click()
  await expect(page.getByText('Call 911 Now')).toBeVisible()
  await expect(page.locator('a[href="tel:911"]')).toBeVisible()
})

test('no symptoms selected continues to care type', async ({ page }) => {
  await page.goto('/en/emergency')
  await page.getByRole('button', { name: /none of these/i }).click()
  await expect(page).toHaveURL(/care-type/)
})
