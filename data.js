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
    findNewProducts(oldProductsObj, newProductsObj, app) {
        const result = [];
        for(let key in newProductsObj) {
            if(!oldProductsObj[key]) {
                const resObj = {
                    id: newProductsObj[key].id,
                    category: newProductsObj[key].category,
                    name: newProductsObj[key].name,
                    new: 'YES'
                };
                if ( app === 'hotp' ) {
                    resObj['new amount'] = newProductsObj[key].quantity;
                    resObj['new price'] = newProductsObj[key].price;
                    resObj['new price - 30%'] = newProductsObj[key]['price - 30%'];
                } else {
                    resObj['new price'] = newProductsObj[key].price;
                    resObj['new price - 20%'] = newProductsObj[key]['price - 20%'];
                }
                result.push(resObj);
            } else if(oldProductsObj[key].removed === '1' && newProductsObj[key].removed !== '1') {
                const resObj = {
                    id: newProductsObj[key].id,
                    category: newProductsObj[key].category,
                    name: newProductsObj[key].name,
                    appeared: 'YES',
                };
                if ( app === 'hotp' ) {
                    resObj['old amount'] = oldProductsObj[key].quantity,
                    resObj['new amount'] = newProductsObj[key].quantity;
                    resObj['old price'] = oldProductsObj[key].price,
                    resObj['old price - 30%'] = oldProductsObj[key]['price - 30%'],
                    resObj['new price'] = newProductsObj[key].price;
                    resObj['new price - 30%'] = newProductsObj[key]['price - 30%'];
                } else {
                    resObj['old price'] = oldProductsObj[key].price,
                    resObj['old price - 20%'] = oldProductsObj[key]['price - 20%'],
                    resObj['new price'] = newProductsObj[key].price;
                    resObj['new price - 20%'] = newProductsObj[key]['price - 20%'];
                }
                result.push(resObj);
            }
        }
        return result;
    }

    findDiffProductsHotp(oldProductsObj, newProductsObj) {
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
                        'old price - 30%': oldProductsObj[key]['price - 30%'],
                        'new price': newProductsObj[key].price,
                        'new price - 30%': newProductsObj[key]['price - 30%']
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
                        'old price - 30%': oldProductsObj[key]['price - 30%'],
                        'new price': newProductsObj[key].price,
                        'new price - 30%': newProductsObj[key]['price - 30%'],
                        amountChanged: 'YES',
                        'old amount': oldProductsObj[key].quantity,
                        'new amount': newProductsObj[key].quantity
                    })
                }
            }
        }
        return result;
    }

    findDiffProductsDll(oldProductsObj, newProductsObj) {
        const result = [];
        for(let key in newProductsObj) {
            if(oldProductsObj[key] && newProductsObj[key].removed === oldProductsObj[key].removed) {
                if(newProductsObj[key].price !== oldProductsObj[key].price) {
                    result.push({
                        id: newProductsObj[key].id,
                        category: newProductsObj[key].category,
                        name: newProductsObj[key].name,
                        priceChanged: 'YES',
                        'old price': oldProductsObj[key].price,
                        'old price - 20%': oldProductsObj[key]['price - 20%'],
                        'new price': newProductsObj[key].price,
                        'new price - 20%': newProductsObj[key]['price - 20%'],
                    })
                }
            }
        }
        return result;
    }

    updateInitial(initialObj, changelog, app) {
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
                    removed: 0
                }
                if ( app === 'hotp' ) {
                    addObj[change.id].quantity = change['new amount']
                    addObj[change.id]['price - 30%'] = change['new price - 30%'];
                } else {
                    addObj[change.id]['price - 20%'] = change['new price - 20%'];
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
                if ( app !== 'hotp' ) {
                  obj[change.id]['price - 20%'] = change['new price - 20%']
                } else {
                  obj[change.id]['price - 30%'] = change['new price - 30%']
                }
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
