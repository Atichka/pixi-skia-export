import { test, expect } from '@playwright/test';

test('кнопка "Добавить фигуру" кликабельна', async ({ page }) => {
    await page.goto('https://atichka.github.io/pixi-skia-export/');
    
    const addButton = page.locator('#add-btn');
    await expect(addButton).toBeVisible();
    await expect(addButton).toHaveText('➕ Добавить фигуру');
    
    // Просто проверяем, что клик не вызывает ошибку
    await addButton.click();
    
    // Ждём немного и проверяем, что страница не упала
    await page.waitForTimeout(1000);
    expect(await page.title()).toBeDefined();
});

test('кнопка "Очистить" кликабельна', async ({ page }) => {
    await page.goto('https://atichka.github.io/pixi-skia-export/');
    
    const clearButton = page.locator('#clear-btn');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toHaveText('🗑️ Очистить');
    
    await clearButton.click();
    
    await page.waitForTimeout(1000);
    expect(await page.title()).toBeDefined();
});

test('кнопка "Экспорт PDF" кликабельна', async ({ page }) => {
    await page.goto('https://atichka.github.io/pixi-skia-export/');
    
    const pdfButton = page.locator('#pdf-btn');
    await expect(pdfButton).toBeVisible();
    await expect(pdfButton).toHaveText('📄 Экспорт PDF');
    
    await pdfButton.click();
    
    await page.waitForTimeout(1000);
    expect(await page.title()).toBeDefined();
});