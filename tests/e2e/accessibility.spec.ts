import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('landing page passes WCAG AA', async ({ page }) => {
  await page.goto('/en')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('emergency screen passes WCAG AA', async ({ page }) => {
  await page.goto('/en/emergency')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('care type selection passes WCAG AA', async ({ page }) => {
  // Set the emergency-screen flag so the sessionStorage guard doesn't
  // redirect away before axe can scan the page content.
  await page.goto('/en/care-type')
  await page.evaluate(() => sessionStorage.setItem('emergencyScreenCompleted', 'true'))
  await page.goto('/en/care-type')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
