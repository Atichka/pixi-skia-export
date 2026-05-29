import { test, expect } from '@playwright/test';

test('статус отображается', async ({ page }) => {
    await page.goto('https://atichka.github.io/pixi-skia-export/');
    
    const status = page.locator('#status');
    await expect(status).toBeVisible();
    expect(await status.textContent()).toBeTruthy();
});