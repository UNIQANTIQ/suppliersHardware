const { chromium } = require('playwright-chromium');
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
                  const id = item.getElementsByClassName('star_container')[0]
                                 .getAttribute('class')
                                 .split(' ')[1];
                  const category = args.category.match(/\.com\/(.*)\.html/)[1]               
                  const name = item.getAttribute('data-name');
                  const price = item.getAttribute('data-price');
                  const priceNum = Number.parseFloat(price);
                  const discountPrice = priceNum - (priceNum * 0.2);
                  const addButtonPresent = item.innerText.includes('ADD TO CART');
    
                  return { 
                      id, 
                      category, 
                      name, 
                      price: price.replace('.', ','), 
                      'price - 30%': discountPrice.toFixed(2).replace('.', ','), 
                      removed: addButtonPresent ? '0' : '1' 
                    };
               }).filter(p => !args.skipCodes.some(c => p.id.includes(c)));
            }, { category, skipCodes });
            scrapData = [...scrapData, ...products];
        };
        await browser.close();
        return scrapData;
    }
}

module.exports = {
    Dlawless
}
