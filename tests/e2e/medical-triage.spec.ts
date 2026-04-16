import { test, expect } from '@playwright/test'

test('full medical triage flow reaches results', async ({ page }) => {
  await page.goto('/en')
  await page.getByRole('link', { name: /get care now/i }).click()
  // Emergency screen — select none
  await page.getByRole('button', { name: /none of these/i }).click()
  // Care type — select Medical (use exact emoji prefix to avoid matching "Medication")
  await page.locator('button', { hasText: /^🩺/ }).click()
  // Answer triage questions with LOW-scoring answers to stay Routine
  // (avoids Urgent path that routes through /location)
  // Q0: Care preference — pick "No preference" (weight 0)
  await page.getByRole('radio', { name: /no preference/i }).click()
  // Q1: Severity — pick "Mild" (weight 2)
  await page.getByRole('radio', { name: /mild/i }).click()
  // Q2: Duration — pick "More than a week" (weight 1)
  await page.getByRole('radio', { name: /more than a week/i }).click()
  // Q3: Fever — pick "No" (weight 0)
  await page.getByRole('radio', { name: /^no$/i }).click()
  // Total score = 3 → Routine → Virtual Care interstitial shows first
  // (virtualCareEligible is true for Routine). Click through it.
  const showOtherBtn = page.getByRole('button', { name: /show me other|other options/i })
  await expect(showOtherBtn).toBeVisible({ timeout: 15000 })
  await showOtherBtn.click()
  await expect(page.getByText('Based on your answers')).toBeVisible({ timeout: 15000 })
})
