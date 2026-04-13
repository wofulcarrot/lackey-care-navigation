import { test, expect } from '@playwright/test'

const MAX_QUESTIONS = 20

test('full medical triage flow reaches results', async ({ page }) => {
  await page.goto('/en')
  await page.getByRole('link', { name: /get care now/i }).click()
  // Emergency screen — select none
  await page.getByRole('button', { name: /none of these/i }).click()
  // Care type — select Medical
  await page.getByText('Medical').click()
  // Answer triage questions using ARIA role selectors
  let questionCount = 0
  while (questionCount < MAX_QUESTIONS) {
    const answerOption = page.locator('[role="radio"], [role="checkbox"]').first()
    if (!(await answerOption.isVisible({ timeout: 2000 }).catch(() => false))) break
    await answerOption.click()
    // Wait for either the next question or results to appear
    await page.waitForFunction(() => {
      return document.querySelector('[role="radio"], [role="checkbox"]') !== null
        || document.body.textContent?.includes('Based on your answers')
    }, { timeout: 5000 })
    if (await page.getByText('Based on your answers').isVisible().catch(() => false)) break
    questionCount++
  }
  await expect(page.getByText('Based on your answers')).toBeVisible()
})
