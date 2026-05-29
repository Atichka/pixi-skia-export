import { test, expect } from '@playwright/test';

test.skip('кнопка "Экспорт PDF" вызывает скачивание', async ({ page }) => {
    await page.goto('https://atichka.github.io/pixi-skia-export/');
    
    const pdfButton = page.locator('#pdf-btn');
    await expect(pdfButton).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await pdfButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});