const puppeteer = require('puppeteer');
const config = require('./config.json');

(async function() {
  const user_name = config.username;
  const password = config.password;

  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  // open twitter
  await page.goto('https://twitter.com/login');

  // Login
  await page.$eval('.js-username-field.email-input.js-initial-focus', (e, uName) => e.value = uName, user_name)
  await page.$eval('.js-password-field', (e, pwd) => e.value = pwd, password)
  await page.click('.submit.EdgeButton.EdgeButton--primary.EdgeButtom--medium')

  // wait till page load
  await page.waitForNavigation();

  let newPage = await browser.newPage();
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

  await browser.close();
})();
