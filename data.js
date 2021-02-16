class Data {
    findRemovedProducts(oldProductsObj, newProductsObj) {
        const result = [];
        for(let key in oldProductsObj) {
            if(!newProductsObj[key] && oldProductsObj[key].removed === '0') {
                result.push({
                    id: oldProductsObj[key].id,
                    category: oldProductsObj[key].category,
                    name: oldProductsObj[key].name,
                    removed: 'YES'
                });
            }
        }
        return result;
    }
    //find added and appeared products
    findNewProducts(oldProductsObj, newProductsObj) {
        const result = [];
        for(let key in newProductsObj) {
            if(!oldProductsObj[key]) {
                result.push({
                    id: newProductsObj[key].id,
                    category: newProductsObj[key].category,
                    name: newProductsObj[key].name,
                    new: 'YES',
                    'new price': newProductsObj[key].price,
                    'new amount': newProductsObj[key].quantity,
                });
            } else if(oldProductsObj[key].removed === '1') {
                result.push({
                    id: newProductsObj[key].id,
                    category: newProductsObj[key].category,
                    name: newProductsObj[key].name,
                    appeared: 'YES',
                    'old price': oldProductsObj[key].price,
                    'new price': newProductsObj[key].price,
                    'old amount': oldProductsObj[key].quantity,
                    'new amount': newProductsObj[key].quantity
                });
            }
        }
        return result;
    }

    findDiffProducts(oldProductsObj, newProductsObj) {
        const result = [];
        for(let key in newProductsObj) {
            if(oldProductsObj[key] && oldProductsObj[key].removed === '0') {
                if(newProductsObj[key].price !== oldProductsObj[key].price && newProductsObj[key].quantity === oldProductsObj[key].quantity) {
                    result.push({
                        id: newProductsObj[key].id,
                        category: newProductsObj[key].category,
                        name: newProductsObj[key].name,
                        priceChanged: 'YES',
                        'old price': oldProductsObj[key].price,
                        'new price': newProductsObj[key].price,
                    })
                }
                if (newProductsObj[key].price === oldProductsObj[key].price && newProductsObj[key].quantity !== oldProductsObj[key].quantity) {
                    result.push({
                        id: newProductsObj[key].id,
                        category: newProductsObj[key].category,
                        name: newProductsObj[key].name,
                        amountChanged: 'YES',
                        'old amount': oldProductsObj[key].quantity,
                        'new amount': newProductsObj[key].quantity
                    })
                }
                if(newProductsObj[key].price !== oldProductsObj[key].price && newProductsObj[key].quantity !== oldProductsObj[key].quantity) {
                    result.push({
                        id: newProductsObj[key].id,
                        category: newProductsObj[key].category,
                        name: newProductsObj[key].name,
                        priceChanged: 'YES',
                        'old price': oldProductsObj[key].price,
                        'new price': newProductsObj[key].price,
                        amountChanged: 'YES',
                        'old amount': oldProductsObj[key].quantity,
                        'new amount': newProductsObj[key].quantity
                    })
                }
            }
        }
        return result;
    }

    updateInitial(initialObj, changelog) {
        const resultArr = [];
        const obj = {...initialObj};
        changelog.forEach(change => {
            if(change.new === 'YES') {
                let addObj = {};
                addObj[change.id] = {
                    id: change.id,
                    category: change.category,
                    name: change.name,
                    price: change['new price'],
                    quantity: change['new amount'],
                    removed: 0
                }
                Object.assign(obj, addObj)
            }
            if(change.removed === 'YES') {
                obj[change.id].removed = 1
            }
            if(change.appeared === 'YES') {
                obj[change.id].removed = 0; 
            }
            if(change.priceChanged === 'YES') {
                obj[change.id].price = change['new price']
            }
            if(change.amountChanged === 'YES') {
                obj[change.id].quantity = change['new amount']
            }
        });
        for(let key in obj ) {
            resultArr.push(obj[key]);
        }
        //toDo add sort
        return resultArr.sort((a, b) => {
            if (a.category > b.category) {
              return 1; 
            }
            if (a.category < b.category) {
              return -1; 
            }
            return 0;
          });;
    }
}

module.exports = {
   Data
}