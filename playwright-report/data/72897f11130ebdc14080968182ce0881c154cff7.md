# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> has title
- Location: tests\example.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "https://playwright.dev/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('has title', async ({ page }) => {
> 4  |   await page.goto('https://playwright.dev/');
     |              ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  5  | 
  6  |   // Expect a title "to contain" a substring.
  7  |   await expect(page).toHaveTitle(/Playwright/);
  8  | });
  9  | 
  10 | test('get started link', async ({ page }) => {
  11 |   await page.goto('https://playwright.dev/');
  12 | 
  13 |   // Click the get started link.
  14 |   await page.getByRole('link', { name: 'Get started' }).click();
  15 | 
  16 |   // Expects page to have a heading with the name of Installation.
  17 |   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  18 | });
  19 | 
```