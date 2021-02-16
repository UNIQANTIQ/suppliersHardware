
const { SpreadSheet } = require('./spreadsheet');
const { Data } = require('./data');
const { HARDWAREOFTHEPAST, CATEGORIES, URL } = require('./constants');
const sheet = new SpreadSheet(HARDWAREOFTHEPAST);
const data = new Data();

const {
  chromium
} = require('playwright-chromium');
const printMessage = require('print-message');


const getDataByCategory = async (page, category, skipCodes) => {
  const result = [];
  await page.goto(`${URL}/${category}?searching=Y&sort=7&cat=1955&show=1000&page=1`, {waitUntil: 'load', timeout: 0});
  await page.waitForLoadState('domcontentloaded');
  const productUrls = await page.$$eval('.v-product > .v-product__title',
      (es, skip) => es.reduce((res, el) => {
        const code = el.title.split(' ')[0];
        if (!skip.includes(code)) {
          res.push(el.href);
        }
        return res;
      },[]), skipCodes);     
  //toDo return back j < number
  for(let i = 0; i < productUrls.length; i++) {
     try {
      await page.goto(productUrls[i]);
      const name = await page.$eval('span[itemprop="name"]', el => el.textContent.trim());
      //there are products without price and quantity.We should support it:
      let price =  await page.$('span[itemprop="price"]');
      if( price ) {
        price = await page.$eval('span[itemprop="price"]', el => {
          const text = el.textContent.trim().replace('.', ',');
          if( text.endsWith('0') ) {
            return text.slice(0,-1);
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

const getAllProductsData = async (categories, skipCodes) => {
  let resultArr = [];
  const browser = await chromium.launch({ headless: true});
  const page = await browser.newPage();
  for (let i = 0; i < categories.length; i++) {
     const products = await getDataByCategory(page, categories[i], skipCodes);
     resultArr = [...resultArr, ...products];
     printMessage([
      `Completed scrapping the category ${categories[i]}`
    ]);
  }
  await browser.close();
  return resultArr; 
}

(async () => {
  const skipCodes = await sheet.getSkipCodes();
  const initialData = await sheet.getInitialData();
  printMessage([
    `Please, be patient :)`,
    `We are scanning all products!`
  ]);
  const scrapData = await Promise.all([ getAllProductsData([CATEGORIES[0]], skipCodes),
                                  getAllProductsData([CATEGORIES[1], CATEGORIES[2]], skipCodes),
                                  getAllProductsData([CATEGORIES[3], CATEGORIES[4]], skipCodes),
                                  getAllProductsData([CATEGORIES[5], CATEGORIES[6]], skipCodes)]);
  // const actualData = await getAllProductsData([CATEGORIES[3]], skipCodes);
  const actualData = scrapData.reduce((acc, i) => [...acc, ...i], []);

  if(!initialData.length) {
    printMessage([
      `Looks like it is first run of the script.`,
      `We will store all data in the AllProducts sheet.`
    ]);
    await sheet.writeAllProducts(actualData);
  } else {
    const initialObj = initialData.reduce((acc, prev) => {
      acc[prev.id] = prev;
      return acc; }, {});
    const actualObj = actualData.reduce((acc, prev) => {
      acc[prev.id] = prev;
      return acc; }, {});
    const removedProducts = data.findRemovedProducts(initialObj, actualObj);
    const newProducts = data.findNewProducts(initialObj, actualObj);
    const diffProducts = data.findDiffProducts(initialObj, actualObj);
    const changelog = [...removedProducts, ...newProducts, ...diffProducts];
    const updatedInitialData = data.updateInitial(initialObj, changelog);
    await sheet.clearInitialData();
    await sheet.writeAllProducts(updatedInitialData);
    await sheet.writeAnalizeResult(changelog);
    printMessage([
      `Script has been completed.`,
      `Please open your Google Sheet and check the AnalizeResult sheet.`
    ]);
  }
})();
