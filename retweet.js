const puppeteer = require('puppeteer-core');
const config = require('./config.json');

(async function() {
  const user_name = config.username;
  const password = config.password;

  let browser, page;

  let launchOptions = {
    headless: true,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if(config.executablePath) {
    launchOptions.executablePath = config.executablePath; 
  }

  browser = await puppeteer.launch(launchOptions);

  try {
    page = await browser.newPage();
    // open twitter
    await page.goto('https://twitter.com/login');

    // Login
    await page.$eval('.js-username-field.email-input.js-initial-focus', (e, uName) => e.value = uName, user_name)
    await page.$eval('.js-password-field', (e, pwd) => e.value = pwd, password)
    await page.$eval('form.signin', e => e.submit());
    // wait till page load
    await page.waitForNavigation();
  } catch(err) {
    await handleError(page, err);
  }

  await page.close(); 
  let newPage;

  try {
    newPage = await browser.newPage();
    let retweetSel = '[data-testid="retweet"]';

    let targetHandle = config.handle; 
    await newPage.goto(`https://twitter.com/${targetHandle}`);

    await newPage.waitFor(retweetSel);

    let totalTweets = await newPage.$$eval(retweetSel, e => e.length);

    console.log('total tweets: ', totalTweets);
    for(let i = 0; i < totalTweets; i++){
      try {
        console.log('clicking 1')

        await newPage.$$eval(retweetSel, (ele, index) => {
          console.log('inside 1')
          ele[index].click()
        }, i);

        console.log('clicked 1')
        let retweetConfirm = '[data-testid="retweetConfirm"]';
        await newPage.waitFor(500);
        console.log('clicking 2')
        await newPage.$eval(retweetConfirm, e => {
          e.click()
        });

        console.log('clicked 2')
      } catch(err) {
        console.log(`Retweet failed for ${i+1} tweet`);
        console.log(`Logging err: ${err}`);
      }
    }
  } catch(err) {
    await handleError(newPage, err);
  } finally {
    await browser.close();
  }

  async function handleError(page, err) {
    let dString = (new Date).toISOString();
    console.log(`Error at ${dString}: ${err.message}`);
    await page.screenshot({
      path: `./${dString}.png`,
      fullPage: true
    });
  }
})();
