import { test, expect } from '@playwright/test';

test('главная страница загружается', async ({ page }) => {
    await page.goto('https://atichka.github.io/pixi-skia-export/');
    
    // Проверяем заголовок
    await expect(page.locator('h2')).toContainText('Pixi + Skia');
    
    // Проверяем, что Pixi канвас существует
    const pixiCanvas = page.locator('canvas').first();
    await expect(pixiCanvas).toBeVisible();
});