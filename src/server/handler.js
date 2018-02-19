const db = require('./db');
const log = require('./log');
const env = require('./env');
const util = require('util');

const notify = require('./notify');

const exec = util.promisify(require('child_process').exec);
const getCommandOutput = (command) => exec(command).then(({ stdout }) => stdout);

const itemTemperatures = [ 'storage', 'fridge' ];
const [ DENIED, CONFIRMING, FETCHING, DELIVERING, ARRIVED, PAYED ] = Array(1000).fill().map((_, i) => i);
const orderStatuses = [ 'denied', 'confirming', 'fetching', 'arriving', 'paying', 'payed' ];

const adminAuth = ({ key }) => new Promise((resolve, reject) => env.keyIsAdmin(key) ? resolve() : reject());

const itemFromName = (name) => db.data.items.find(({ name: itemName }) => name === itemName); const orderFromToken = (token) => db.data.orders.find(({ token: orderToken }) => token === orderToken);

const applyOp = ({ op, reference, property, value, onDefault=()=>{} }) => {
  switch(op) {
    case 'set':
      reference[property] = value;
      break;
    case 'add':
      reference[property] += value;
      break;
    case 'sub':
      reference[property] -= value;
      break;
    case 'del':
      delete reference[property];
      break;
    default:
      onDefault();
  }
}

module.exports = (body) => new Promise((resolve, reject) => {
  const { action='order' } = body;
  log(`performing action: ${action}`);

  switch(action) {
    case 'get info':
      const { tokens=[] } = body;
      resolve({
        ok: true,
        data: {
          currency: db.data.currency,
          available: db.data.available,
          orders: tokens.map(orderFromToken).filter(Boolean).map((order) => ({ ...order, status: orderStatuses[order.status]})),
          items: db.data.items.map(({
            name, price, imageSrc, location: { storage, fridge, transit, reserved }, stockPrice, size
          }) => ({
            name,
            price,
            stockPrice,
            size,
            imageSrc,
            location: {
              /*
              storage: storage > 20 ? '>20' : (storage > 10 ? '>10' : storage.toString()),
              fridge: fridge > 20 ? '>20' : (fridge > 10 ? '>10' : fridge.toString()),
              reserved: reserved + transit > 20 ? '>20' : (reserved + transit > 10 ? '>10' : reserved.toString()),
              */
              storage,
              fridge,
              reserved: reserved + transit
            }
          }))
        }
      });
      break;
    case 'admin get info':
      adminAuth(body)
        .then(() => {
          resolve({
            ok: true,
            data: {
              ...db.data,
              orders: db.data.orders.filter(Boolean).map((order) => ({ ...order, status: orderStatuses[order.status]})),
            }
          });
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        })
      break;
    case 'order': 
      if(!db.data.available) {
        return reject(`service unavailable`);
      }
      
      const { name=db.data.items[0].name } = body;
      
      const item = db.data.items.find(({ name: itemName }) => name === itemName); 
      if(item) {
        const { cold=false, humanName } = body;
        const location = itemTemperatures[+cold];

        let { amount=1, x, y } = body;
        amount = Number(amount);
        x = Number(x);
        y = Number(y);

        if(Number.isNaN(amount) || amount < 1 || amount % 1 !== 0) {
          reject(`invalid item amount`);

        } else if(Number.isNaN(x) || Number.isNaN(y) || x > 1 || x < 0 || y > 1 || y < 0) {
          reject(`invalid x and y`);

        } else if(item.location[location] - amount >= 0) {
          item.location[location] -= amount;
          item.location.reserved += amount;

          getCommandOutput(`shuf -n 3 ${__dirname}/token-words.txt | paste -sd " "`)
            .then((token) => {

              token = token.trim();

              const order = {
                token, 
                x,
                y,
                humanName,
                name,
                location,
                amount,
                orderDate: new Date().toJSON(),
                status: CONFIRMING
              }

              db.data.orders.push(order);
              notify(`new order: ${JSON.stringify(order)}`);
              db.set(db.data);

              resolve({ 
                ok: true,
                token
              });
            });
        } else {
          reject(`not enough items of temperature`);
        } 
      } else {
        reject(`faulty name ${name}`);
      }
      break;
    case 'cancel order':
      const { token } = body;
      
      const order = orderFromToken(token);

      if(order) {
        const { status } = order;

        if(status <= FETCHING) {
          const { name, amount, location } = order;
          const item = itemFromName(name);
          ``
          item.location[status === FETCHING ? 'transit' : 'reserved'] -= amount;
          item.location[location] += amount;

          db.data.orders.splice(db.data.orders.indexOf(order), 1);
          notify(`order cancelled: ${JSON.stringify(order)}`);
          db.set();
          resolve({
            ok: true 
          });
        } else {
          reject(`item already on way: ${orderStatuses[order.status]}`);
        }
      } else {
        reject(`faulty token ${token}`);
      }
      break;
    case 'admin confirm order':
      adminAuth(body)
        .then(() => {
          const { token } = body;
          const order = orderFromToken(token);

          if(order) {
            const { status } = order;
            if(status === CONFIRMING) {
              const { name, amount } = order;

              order.status = FETCHING;

              const item = itemFromName(name);
              item.reserved -= amount;
              item.transit += amount;

              db.set();
              resolve({
                ok: true 
              })
            } else {
              reject(`order not in confirmed status: ${orderStatuses[status]}`);
            }
          } else {
            reject(`faulty token ${token}`);
          }
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        })
      break;
    case 'admin fetch order':
      adminAuth(body)
        .then(() => {
          const { token } = body;
          const order = orderFromToken(token);

          if(order) {
            const { status } = order;
            if(status === FETCHING) {
              order.status = DELIVERING;

              db.set();
              resolve({
                ok: true 
              });
            } else {
              reject(`order not in confirmed status: ${orderStatuses[status]}`); 
            }
          } else {
            reject(`faulty token ${token}`) 
          }
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        })
      break;
    case 'admin deliver order':
      adminAuth(body)
        .then(() => {
          const { token } = body;
          const order = orderFromToken(token);

          if(order) {
            const { status } = order;
            if(status === DELIVERING) {
              const { name, amount } = order;

              order.status = ARRIVED; 

              const item = itemFromName(name);
              item.location.transit -= amount;

              db.set();
              resolve({
                ok: true 
              });
            } else {
              reject(`order not in delivering status: ${orderStatuses[status]}`); 
            }
          } else {
            reject(`faulty token ${token}`) 
          }
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        })
      break;
    case 'admin receive payment order':
      adminAuth(body)
        .then(() => {
          const { token } = body;
          const order = orderFromToken(token);

          if(order) {
            const { status } = order;
            if(status === ARRIVED) {
              const { name, amount } = order;

              order.status = PAYED; 

              const item = itemFromName(name);
              const { price, stockPrice=price } = item;
              const money = price * amount;
              db.data.moneyEarnt += money;
              db.data.marginEarnt += money - stockPrice * amount;

              db.data.orders.splice(db.data.orders.indexOf(order), 1);
              console.log(db.data.orders);

              db.set();
              resolve({ 
                ok: true 
              });
            } else {
              reject(`order not in arrived status: ${orderStatuses[status]}`); 
            }
          } else {
            reject(`faulty token ${token}`) 
          }
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        })
      break;
    case 'admin deny order':
      adminAuth(body)
        .then(() => {
          const { token } = body;
          const order = orderFromToken(token);

          if(order) {
            const { status, name, amount, cold } = order;

            const item = itemFromName(name); 
  
            item.location[status === CONFIRMING ? 'reserved' : 'tranist'] -= amount;
            item.location[itemTemperatures[cold]] += amount;

            db.data.orders.splice(db.data.orders.indexOf(order), 1);

            db.set();
            resolve({
              ok: true 
            });
            
          } else {
            reject(`faulty token ${token}`) 
          }
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        })
      break;
    case 'admin service available':
      adminAuth(body)
        .then(() => {
          db.data.available = true;
          db.set();

          resolve({
            ok: true 
          })
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        });
      break;
    case 'admin service unavailable':
      adminAuth(body)
        .then(() => {
          db.data.available = false;
          db.set();

          resolve({
            ok: true 
          })
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        });
      break;
    case 'admin change db':
      adminAuth(body)
        .then(() => {

          let ops = op
          const { location, op='set', property, value, name, actOnLocation=false } = body;
          
          switch(location) {
            case 'all items':
              if(property !== undefined) {
                db.data.items.forEach((item) => applyOp({ 
                  op,
                  reference: actOnLocation ? item.location : item,
                  property,
                  value,
                  onDefault: () => reject(`invalid op ${op}`)
                }));
              } else {
                reject(`no property found`);
              }
              break;
            case 'item from name':
              if(property !== undefined) {
                const item = itemFromName(name);

                if(item) {
                  applyOp({
                    op,
                    reference: actOnLocation ? item.location : item,
                    property,
                    value,
                    onDefault: () => reject(`invalid op ${op}`)
                  });
                } else {
                  reject(`invalid item name ${name}`);
                }
              } else {
                reject(`no property found`);
              }
              break;
            case 'all orders':
              if(property !== undefined) {
                db.data.orders.forEach((order) => doOp({
                  op,
                  reference: order,
                  property,
                  value,
                  onDefault: () => reject(`invalid op ${op}`)
                }));
              } else {
                reject(`no property found`); 
              }
              break;
            case 'order from token':
              if(property !== undefined) {

                const { token } = body;

                const order = orderFromToken(token);

                if(order) {
                  db.data.orders.forEach((order) => doOp({
                    op,
                    reference: order,
                    property,
                    value,
                    onDefault: () => reject(`invalid op ${op}`)
                  }));

                } else {
                  reject(`faulty token ${token}`);
                }
              } else {
                reject(`no property found`); 
              }
              break;
            case 'root':
              if(property !== undefined) {
                applyOp({
                  op,
                  reference: db.data,
                  property,
                  value,
                  onDefault: () => reject(`invalid op ${op}`)
                });
              } else {
                reject(`no property found`); 
              }
          }

          db.set();
          resolve({
            ok: true 
          });
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        });
      break;
    case 'test auth':
      adminAuth(body)
        .then(() => {
          resolve({ ok: true })    
        })
        .catch(() => {
          reject(`faulty key: not admin`);
        });
      break;
    default:
      reject(`faulty action "${action}"`);
  }
});
