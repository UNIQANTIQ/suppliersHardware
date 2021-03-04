const { HARDWAREOFTHEPAST_URL } = require('./constants');
const { chromium } = require('playwright-chromium');
const printMessage = require('print-message');

class HOTP {
   async open(page, category) {
    await page.goto(
        `${HARDWAREOFTHEPAST_URL}/${category}?searching=Y&sort=7&cat=1955&show=1000&page=1`,
        {waitUntil: 'load', timeout: 0}
    );
    await page.waitForLoadState('domcontentloaded');
   }

   async getDataByCategory(page, category, skipCodes) {
    const result = [];
    await this.open(page, category);
    const productUrls = await page.$$eval('.v-product > .v-product__title',
        (es, skip) => es.reduce((res, el) => {
          const code = el.title.split(' ')[0];
          if (!skip.includes(code)) {
            res.push(el.href);
          }
          return res;
        },[]), skipCodes);     
    for(let i = 0; i < productUrls.length; i++) {
       try {
        await page.goto(productUrls[i]);
        const name = await page.$eval('span[itemprop="name"]', el => el.textContent.trim());
        //there are products without price and quantity.We should support it:
        let price =  await page.$('span[itemprop="price"]');
        if( price ) {
          price = await page.$eval('span[itemprop="price"]', el => {
            const text = el.textContent.trim().replace('.', ',');
            if( text.endsWith('0') && text.slice(-2,-1) !== '0') {
              return text.slice(0,-1);
            }
            if ( text.slice(-2) === '00' ) {
              return text.slice(0,-3)
            }
            return text
          });
        } else {
          price = 'no_price'
        }
        const quantity = await page.$eval('div[itemprop="offers"]', el => {
          const q = el.textContent.match(/Quantity in Stock:(\d{0,5})/);
          if (q) {
            return q[1]
          } else {
            return 'no_quantity'
          }
        });
        const productCode = await page.$eval('.product_code', el => el.textContent.trim());
        result.push({ id: productCode, category, name, price, quantity, removed: 0});
       } catch(e) {
         console.error(`Smth wrong with a product ${productUrls[i]}`);
         console.log(e);
       }
  
    }
    return result;
   }

   async getAllProductsData(categories, skipCodes) {
    let resultArr = [];
    const browser = await chromium.launch({ headless: false});
    const page = await browser.newPage();
    for (let i = 0; i < categories.length; i++) {
       const products = await this.getDataByCategory(page, categories[i], skipCodes);
       resultArr = [...resultArr, ...products];
       printMessage([
        `Completed scrapping the category ${categories[i]}`
      ]);
    }
    await browser.close();
    return resultArr; 
   }


    
    
    
}

module.exports = { HOTP }