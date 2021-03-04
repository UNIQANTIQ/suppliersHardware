const { GoogleSpreadsheet } = require('google-spreadsheet');
const credentials = require('./client_secret.json');

class SpreadSheet {
    constructor(id) {
        this.spreadSheet = new GoogleSpreadsheet(id);
        this.credentials = credentials;
    }

    async initialize() {
        await this.spreadSheet.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key,
          });
        await this.spreadSheet.loadInfo();
    }

    async getSkipCodes() {
        await this.initialize();
        const rows = await this.spreadSheet.sheetsByTitle['Skip'].getRows();
        return rows.map(row => row.id);
    }

    async getInitialData(app) {
        await this.initialize();
        const rows = await this.spreadSheet.sheetsByTitle['AllProducts'].getRows();
        return rows.map(row => {
            const { id, category, name, price, removed} = row;
            if( app === 'hotp') {
                return {id, category, name,	price, removed, quantity: row.quantity};
            } else {
                return {id, category, name,	price, removed, 'price - 30%': row['price - 30%']};
            }
        });
    }

    async getCategories() {
        await this.initialize();
        const rows = await this.spreadSheet.sheetsByTitle['Categories'].getRows();
        return rows.map(row => row.url);
    }
    
    async clearAnalizeResult() {
        await this.initialize();
        await this.spreadSheet.sheetsByTitle['AnalizeResult'].clear();
        await this.spreadSheet.sheetsByTitle['AnalizeResult']
                  .setHeaderRow(['id', 'category', 'name', 'new', 'removed', 'appeared', 
                                 'priceChanged', 'old price', 'new price', 'amountChanged', 
                                'old amount', 'new amount']);
    }

    async clearInitialData(app) {
        const headerArray = app === 'hotp'
                                    ? ['id', 'category', 'name', 'price', 'quantity', 'removed'] 
                                    : ['id', 'category', 'name', 'price', 'price - 30%', 'removed'];
        await this.initialize();
        await this.spreadSheet.sheetsByTitle['AllProducts'].clear();
        await this.spreadSheet.sheetsByTitle['AllProducts']
                  .setHeaderRow(headerArray);
    }

    async writeAllProducts(products, app) {
        await this.clearInitialData(app);
        await this.initialize();
        await this.spreadSheet.sheetsByTitle['AllProducts'].addRows(products);
    }

    async writeAnalizeResult(results, app) {
        const currentdate = new Date();
        const dateTime = `${currentdate.getDate()}/${currentdate.getMonth()+1}/${currentdate.getFullYear()}_${currentdate.getHours()}-${currentdate.getMinutes()}`;
        const title = `AnalizeResult_${dateTime}`;
        const headerValues = app === 'hotp' 
                             ? ['id', 'category', 'name', 'new', 'removed', 'appeared', 
                             'priceChanged', 'old price', 'new price', 'amountChanged', 
                             'old amount', 'new amount']
                             : ['id', 'category', 'name', 'new', 'removed', 'appeared', 
                             'priceChanged', 'old price', 'old price - 30%', 'new price',
                             'new price - 30%']
        await this.initialize();
        await this.spreadSheet.addSheet({ title, headerValues });
        await this.initialize();
        console.log(title);
        await this.spreadSheet.sheetsByTitle[title].addRows(results);
    }
}

module.exports = {
    SpreadSheet
}