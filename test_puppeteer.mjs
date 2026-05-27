import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Go to the dashboard
  await page.goto('http://localhost:5173/fitpat/login');
  
  // We don't have login credentials for superadmin in this script easily.
  // Wait, I can just inject the auth state or just see the DOM of the home page.
  // Actually, I just want to see if `proburn_website` is present ANYWHERE in the rendered HTML!
  
  // Let's just fetch the raw HTML of the login page first
  const content = await page.content();
  if (content.includes('proburn_website')) {
    console.log("FOUND proburn_website in login page!");
  } else {
    console.log("Not found in login page.");
  }
  
  await browser.close();
})();
