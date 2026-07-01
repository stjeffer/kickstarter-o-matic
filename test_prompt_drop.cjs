const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('http://localhost:3000/discovery.html');
  await page.waitForTimeout(1000);

  // Import the BBC JSON
  const sample = {
    title: 'BBC Strategy Discovery',
    customer: 'BBC',
    description: 'Strategic planning session',
    date: '2026-07-15',
    sessionType: 'Discovery',
    stages: [
      {
        name: 'Ideation',
        canvasType: 'whiteboard',
        prompts: [
          {
            category: 'Audience',
            text: 'Who are our primary users and what jobs are they trying to get done?',
            timebox: '10 min',
            activity: {
              prompt: 'Who are our primary users and what jobs are they trying to get done?',
              instructions: 'Discuss in pairs',
              activityType: 'Audience'
            }
          }
        ]
      }
    ]
  };

  // Use the import button
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('#btnImport')
  ]);

  const jsonPath = '/tmp/bbc_sample.json';
  const fs = require('fs');
  fs.writeFileSync(jsonPath, JSON.stringify(sample));

  await fileChooser.setFiles(jsonPath);
  await page.waitForTimeout(1200);

  // Count prompt cards before drag
  const cardsBefore = await page.locator('.card').count();

  // Drag the first prompt to the canvas
  const prompt = page.locator('.prompt-card').first();
  const canvas = page.locator('#world');

  // Use dragTo with force: true because prompts might not be visible
  await prompt.dragTo(canvas, { force: true, targetPosition: { x: 400, y: 300 } });
  await page.waitForTimeout(500);

  const cardsAfter = await page.locator('.card').count();
  const lastCard = page.locator('.card').last();
  const classes = await lastCard.evaluate(el => el.className);
  const text = await lastCard.textContent();

  console.log('Cards before:', cardsBefore);
  console.log('Cards after:', cardsAfter);
  console.log('Last card classes:', classes);
  console.log('Last card text:', text.substring(0, 100));

  // Screenshot
  await page.screenshot({ path: '/tmp/prompt_drop_test.png', fullPage: true });
  console.log('Screenshot saved to /tmp/prompt_drop_test.png');

  await browser.close();
})();
