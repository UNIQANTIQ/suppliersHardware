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

    async getInitialData() {
        await this.initialize();
        const rows = await this.spreadSheet.sheetsByTitle['AllProducts'].getRows();
        return rows.map(row => {
            const { id, category, name, price, quantity, removed} = row;
            return {id, category, name,	price, quantity, removed}
        });
    }
    
    async clearAnalizeResult() {
        await this.initialize();
        await this.spreadSheet.sheetsByTitle['AnalizeResult'].clear();
        await this.spreadSheet.sheetsByTitle['AnalizeResult']
                  .setHeaderRow(['id', 'category', 'name', 'new', 'removed', 'appeared', 
                                 'priceChanged', 'old price', 'new price', 'amountChanged', 
                                'old amount', 'new amount']);
    }

    async clearInitialData() {
        await this.initialize();
        await this.spreadSheet.sheetsByTitle['AllProducts'].clear();
        await this.spreadSheet.sheetsByTitle['AllProducts']
                  .setHeaderRow(['id', 'category', 'name', 'price',	'quantity',	'removed']);
    }

    async writeAllProducts(products) {
        await this.clearInitialData();
        await this.initialize();
        await this.spreadSheet.sheetsByTitle['AllProducts'].addRows(products);
    }

    async writeAnalizeResult(results) {
        const currentdate = new Date();
        const dateTime = `${currentdate.getDate()}/${currentdate.getMonth()+1}/${currentdate.getFullYear()}_${currentdate.getHours()}-${currentdate.getMinutes()}`;
        const title = `AnalizeResult_${dateTime}`
        await this.initialize();
        await this.spreadSheet.addSheet({ 
            title, 
            headerValues: 
            ['id', 'category', 'name', 'new', 'removed', 'appeared', 
             'priceChanged', 'old price', 'new price', 'amountChanged', 
             'old amount', 'new amount']
        });
        await this.initialize();
        console.log(title);
        await this.spreadSheet.sheetsByTitle[title].addRows(results);
    }
}

module.exports = {
    SpreadSheet
}
