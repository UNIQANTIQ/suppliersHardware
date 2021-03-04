const myArgs = process.argv.slice(2);

const { SpreadSheet } = require('./spreadsheet');
const { Data } = require('./data');
const { HARDWAREOFTHEPAST, HARDWAREOFTHEPAST_CATEGORIES, DLAWLESS } = require('./constants');
const { HOTP } = require('./hotp'); 
const printMessage = require('print-message');
const { Dlawless } = require('./dlawless');

const data = new Data();
const app = myArgs[0] === 'hotp' ? new HOTP() : new Dlawless();
const sheet_id = myArgs[0] === 'hotp' ? HARDWAREOFTHEPAST : DLAWLESS;

(async () => {
    let actualData;
    const sheet = new SpreadSheet(sheet_id);
    const skipCodes = await sheet.getSkipCodes();
    const initialData = await sheet.getInitialData(myArgs[0]);
    if ( myArgs[0] !== 'hotp' ) {
      const categories = await sheet.getCategories();
      actualData = await app.getAllProducts(categories, skipCodes);
    } else {
      const scrapData = await Promise.all([ app.getAllProductsData([HARDWAREOFTHEPAST_CATEGORIES[0]], skipCodes),
                                            app.getAllProductsData([HARDWAREOFTHEPAST_CATEGORIES[1], HARDWAREOFTHEPAST_CATEGORIES[2]], skipCodes),
                                            app.getAllProductsData([HARDWAREOFTHEPAST_CATEGORIES[3], HARDWAREOFTHEPAST_CATEGORIES[4]], skipCodes),
                                            app.getAllProductsData([HARDWAREOFTHEPAST_CATEGORIES[5], HARDWAREOFTHEPAST_CATEGORIES[6]], skipCodes)]);
      actualData = scrapData.reduce((acc, i) => [...acc, ...i], []);
    }
    if(!initialData.length) {
      printMessage([
        `Looks like it is first run of the script.`,
        `We will store all data in the AllProducts sheet.`
      ]);
      await sheet.writeAllProducts(actualData, myArgs[0]);
    } else {
      const initialObj = initialData.reduce((acc, prev) => {
        acc[prev.id] = prev;
        return acc; }, {});
      const actualObj = actualData.reduce((acc, prev) => {
        acc[prev.id] = prev;
        return acc; }, {});
      const removedProducts = data.findRemovedProducts(initialObj, actualObj);
      const newProducts = data.findNewProducts(initialObj, actualObj, myArgs[0]);
      const diffProducts = app === 'hotp' ? data.findDiffProductsHotp(initialObj, actualObj) : data.findDiffProductsDll(initialObj, actualObj);
      const changelog = [...removedProducts, ...newProducts, ...diffProducts];
      const updatedInitialData = data.updateInitial(initialObj, changelog, myArgs[0]);
      await sheet.clearInitialData();
      await sheet.writeAllProducts(updatedInitialData, myArgs[0]);
      await sheet.writeAnalizeResult(changelog, myArgs[0]);
      printMessage([
        `Script has been completed.`,
        `Please open your Google Sheet and check the AnalizeResult sheet.`
      ]);
    }
  })();
