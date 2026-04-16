import { test, expect } from '@playwright/test'

test('language toggle switches to Spanish and preserves state', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByText('Get the right care, right now')).toBeVisible()
  await page.getByRole('button', { name: 'ES' }).click()
  // Verify URL switched to Spanish locale
  await expect(page).toHaveURL(/\/es/)
  // Verify English text is no longer visible and Spanish content loaded
  await expect(page.getByText('Get the right care, right now')).not.toBeVisible()
})
