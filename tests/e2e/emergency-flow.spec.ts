import { test, expect } from '@playwright/test'

test('emergency symptom check triggers 911 alert', async ({ page }) => {
  await page.goto('/en/emergency')
  await page.getByRole('button', { name: /chest pain/i }).first().click()
  await page.getByRole('button', { name: /call 911|alert/i }).click()
  await expect(page.getByRole('heading', { name: 'Call 911 Now' })).toBeVisible()
  // The alert has a tel:911 link. The header also has one — use the link
  // with the specific "Call 911 Now" text to avoid strict mode ambiguity.
  await expect(page.getByRole('link', { name: 'Call 911 Now' })).toBeVisible()
})

test('no symptoms selected continues to care type', async ({ page }) => {
  await page.goto('/en/emergency')
  await page.getByRole('button', { name: /none of these/i }).click()
  await expect(page).toHaveURL(/care-type/)
})
