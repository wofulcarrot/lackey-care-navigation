import { test, expect } from '@playwright/test'

test('"Not Sure" meta-triage redirects to correct care type', async ({ page }) => {
  await page.goto('/en')
  await page.getByRole('link', { name: /get care now/i }).click()
  // Emergency screen — select none
  await page.getByRole('button', { name: /none of these/i }).click()
  // Care type — select "Not Sure"
  await page.getByRole('button', { name: /not sure/i }).click()
  // Answer meta-triage — select the dental-related answer
  await page.getByRole('radio', { name: /tooth|dental|mouth/i }).click()
  // Verify we've been redirected into Dental's triage flow
  await expect(page).toHaveURL(/careType=/, { timeout: 10000 })
  // Dental Q1: Swelling — pick low-scoring "No swelling" (weight 0)
  await page.getByRole('radio', { name: /no swelling/i }).click()
  // Dental Q2: Pain — pick low-scoring "Mild or no pain" (weight 1)
  await page.getByRole('radio', { name: /mild|no pain/i }).click()
  // Total score = 1 → Elective → skips location, goes to results
  await expect(page.getByText('Based on your answers')).toBeVisible({ timeout: 15000 })
})
