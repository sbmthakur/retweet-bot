const puppeteer = require('puppeteer-core');
const config = require('./config.json');

let timeout = setTimeout(() => {
  console.log('exiting forcefully');
  /*eslint-disable no-undef*/
  process.exit(1);
}, 120000);

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
    await page.$eval('.js-username-field', (e, uName) => e.value = uName, user_name);
    await page.$eval('.js-password-field', (e, pwd) => e.value = pwd, password);
    await page.$eval('form.signin', e => e.submit());
    // wait till page load
    await page.waitForNavigation();
    let retweetSel = '[data-testid="retweet"]';

    let targetHandle;

    if(config.handle) {
      targetHandle = config.handle;
    } else {
      // Select a random handle
      let handles = config.handles;
      let randomIndex = Math.floor(Math.random() * handles.length);
      targetHandle = config.handles[randomIndex];
    }

    console.log(`Handle selected: ${targetHandle}`);
    await page.goto(`https://twitter.com/${targetHandle}`);

    await page.waitFor(retweetSel);

    let totalTweets = await page.$$eval(retweetSel, e => e.length);

    console.log('total tweets: ', totalTweets);
    for(let i = 0; i < totalTweets; i++){
      try {
        console.log('clicking 1');

        await page.$$eval(retweetSel, (ele, index) => {
          ele[index].click();
        }, i);

        console.log('clicked 1');
        let retweetConfirm = '[data-testid="retweetConfirm"]';
        await page.waitFor(500);
        console.log('clicking 2');
        await page.$eval(retweetConfirm, e => {
          e.click();
        });

        console.log('clicked 2');
      } catch(err) {
        console.log(`Retweet failed for ${i+1} tweet`);
        console.log(`Logging err: ${err}`);
      }
    }
  } catch(err) {
    await handleError(page, err);
  } finally {
    await browser.close();
    clearTimeout(timeout);
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
