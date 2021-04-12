const { chromium } = require('playwright-chromium');
const _ = require('lodash');
const printMessage = require('print-message');

class Dlawless {
    async open(page, url) {
        await page.goto(`${url}`, {waitUntil: 'load', timeout: 0});
        await page.waitForLoadState('domcontentloaded');
    }

    async getAllProducts(categories, skipCodes) {
        const browser = await chromium.launch({ headless: true});
        const page = await browser.newPage();
        let scrapData = [];
        for (let i=0; i < categories.length; i++) {
            let category = categories[i];
            await this.open(page, category);
            const products = await page.$$eval('.item-boxes > li', (items, args) => {
               return items.map(item => {
                  const url = item.querySelector('.name a')
                                  .getAttribute('href');
                  const id = item.querySelector('.star_container')
                                 .getAttribute('class')
                                 .split(' ')[1];
                  const category = args.category.match(/\.com\/(.*)\.html/)[1]               
                  const name = item.getAttribute('data-name');
                  const price = item.getAttribute('data-price');
                  const priceNum = Number.parseFloat(price);
                  const discountPrice = priceNum - (priceNum * 0.2);
                  const addButtonPresent = item.innerText.includes('ADD TO CART');
    
                  return {
                      url,
                      id, 
                      category, 
                      name, 
                      price: price.replace('.', ','), 
                      'price - 20%': discountPrice.toFixed(2).replace('.', ','), 
                      removed: addButtonPresent ? '0' : '1' 
                    };
               }).filter(p => !args.skipCodes.some(c => p.id.includes(c)));
            }, { category, skipCodes });
            scrapData = [...scrapData, ...products];
        };
        await browser.close();
        const promises = [];
        const chunksArray = _.chunk(scrapData, Math.round(scrapData.length/5));
        chunksArray.forEach(arr => promises.push(this.checkAllAddToCards(arr)));
        printMessage([
            `Please wait. We are checking all Add to Card buttons!`
          ]);
        const resultData = await Promise.all(promises);
        return resultData.reduce((acc, i) => [...acc, ...i], []);;
    }
    async checkAllAddToCards(products) {
        const browser = await chromium.launch({ headless: true});
        const page = await browser.newPage();
        const resultArray = [...products];
        for( let i=0; i < resultArray.length; i++) {
            if(!+resultArray[i].removed) {
                const isAddToCard = await this.isAddToCardOnPage(resultArray[i],page);
                if(isAddToCard) {
                    resultArray[i].removed = 0;
                }
            }
        }
        await browser.close();
        return resultArray;
    }

    async isAddToCardOnPage(product,  page) {
        await this.open(page, `https://www.dlawlesshardware.com/${product.url}`);
        const addToCard = await page.$('.atc-button');
        return !!addToCard;
    }
}

module.exports = {
    Dlawless
}
