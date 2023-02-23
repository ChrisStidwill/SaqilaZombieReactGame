import { test, expect } from '@playwright/test';

// These tests cycle through next prime, previous prime, next twin, and previous twin, checking the result of
// explainer text and found primes.

test('Header 2 contains expected phrase', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await test.step("Check header states correct phrase", async () =>{
    await expect(page.locator('#explainer1')).toContainText(
      "Each day, 10 films are hosted and those actors go to work.");
  });
});