import Vue from 'vue';
import Vuex from 'vuex';
import api from '@/api';

Vue.use(Vuex);

if(!localStorage.tokens) {
  localStorage.tokens = '';
}

const store = new Vuex.Store({
  state: {
    db: {
      items: [],
      orders: [],
      available: false,
      currency: '€'
    },
    availabilityError: '',
    loaded: false,
    loadedOnce: false,
    adminDB: {},
    userDB: {},
    authed: false,
    humanName: localStorage.humanName || '',
    pos: {
      x: Number(localStorage.x),
      y: Number(localStorage.y),
      isSet: !isNaN(Number(localStorage.x))
    },
    tokens: localStorage.tokens.split(',').filter((token) => token.length > 0),
    authKeyWorks: localStorage.authKeyWorks,
    authKey: localStorage.authKey
  },
  getters: {
    itemFromName: (state) => (name) => state.db.items.filter(({ name: itemName }) => name === itemName)[0] 
  },
  mutations: {
    setAvailabilityError(state, { error }) {
      state.availabilityError = error;
    },
    updateHumanName(state, name) {
      state.humanName = name; 
      localStorage.humanName = name;
    },
    setPos(state, { x, y }) {
      state.pos.x = x;
      state.pos.y = y;

      localStorage.x = x;
      localStorage.y = y;

      state.pos.isSet = !isNaN(x);
    },
    setDB(state, db) {
      state.db = db;
    },
    setLoaded(state, val) {
      state.loaded = val; 
      if(val) {
        state.loadedOnce = true; 
      }
    },
    setAdminDB(state, db) {
      state.adminDB = db;
    },
    setUserDB(state, db) {
      state.userDB = db; 
    },
    setAuthKeyStatus(state, status) {
      state.authKeyWorks = status;
      localStorage.authKeyWorks = status ? 1 : '';
    },
    setAuthed(state, val) {
      state.authed = val; 
    },
    setAuthKey(state, authKey) {
      if(state.authKeyWorks && state.authKey !== authKey) {
        store.commit('setAuthKeyStatus', false);
      }

      localStorage.authKey = authKey;
      state.authKey = authKey;
    },
    setOrderError(state, { error, order }) {
      state.orderError = error;
      this.getters.itemFromName(order.name).orderError = error;
    },
    removeOrder(state, order) {
      state.db.orders.splice(state.db.orders.findIndex(({ name }) => order.name === name), 1); 
    },
    pushOrder(state, order) {
      const { token } = order;

      state.db.orders.push(order);
      store.getters.itemFromName(order.name).location[order.cold ? 'fridge' : 'storage'] -= order.amount;
      

      state.tokens.push(token);
      localStorage.tokens = state.tokens;
    },
    setOrderStatus(state, { order, status }) {
      order.status = status; 
    }
  },
  actions: {
    setAuthentication({ commit, dispatch, state }, { authed, loadDB }) {
      commit('setAuthed', authed);
      if(loadDB) {
        dispatch('loadDB', authed ? state.adminDB : state.userDB);
      }
    },
    checkAuth({ dispatch, commit, state }, { key=state.authKey, attemptAuth }={}) {
      if(attemptAuth) {
        if(!key) {
          return Promise.resolve({ error: 'no key present' })
        }

        return api({ action: 'test auth', key })
      } else {
        return Promise.resolve(state.authed ? { ok: true } : { error: 'not previously authed' }); 
      }

    },
    auth({ dispatch, commit, state }, { key=state.authKey, loadDB=true }) {
      return dispatch('checkAuth', { key, attemptAuth: true })
        .then(({ error, ok }) => {
          if(error) {
            dispatch('setAuthentication', { authed: false, loadDB });
            commit('setAuthKeyStatus', false);
            return { error }; 
          }
          dispatch('setAuthentication', { authed: true, loadDB });
          commit('setAuthKey', key);
          commit('setAuthKeyStatus', true);
          return { ok };
        })
    },
    loadDB({ commit, state }, db) {
      commit('setDB', db);
      commit('setLoaded', true);
    },
    fetchAdminDB({ commit, state }) {
      commit('setLoaded', false);
      if(state.authKeyWorks) {
        return api({ action: 'admin get info', key: state.authKey })
          .then(({ ok, data }) => {
            commit('setAdminDB', data);
          })
      } else {
        return Promise.reject(`auth key not working`); 
      }
    },
    fetchUserDB({ commit, state }) {
      commit('setLoaded', false);
      return api({ action: 'get info', tokens: state.tokens })
        .then(({ ok, data }) => {
          commit('setUserDB', data); 
        })
    },
    fetchDBs({ dispatch, commit, state }, { attemptAuth=false }={}) {
      commit('setLoaded', false);
      return Promise.all([
        dispatch('checkAuth', { attemptAuth }) 
          .then(({ error, ok }) => {
            if(ok) {
              return dispatch(`fetchAdminDB`);
            }
          }),
        dispatch('fetchUserDB')
      ])
        .then(() => {
          dispatch('loadDB', state.authed ? state.adminDB : state.userDB);  
          commit('setAvailabilityError', { error: `` }); 
        })
        .catch(() => {
          commit('setAvailabilityError', { error: `can't connect to api` }); 
        })
    },
    setAvailable({ dispatch, state }, val) {
      return api({ action: val ? 'admin service available' : 'admin service unavailable', key: state.authKey })
        .then(() => dispatch('fetchDBs'));
    },
    changeOrderStatus({ commit, dispatch, state }, { order, change }) {
      return api({ action: `admin ${change} order`, token: order.token, key: state.authKey })
        .then(({ error, ok }) => {
          if(error) {
            commit('setOrderError', { error, order }) 
            return { error }
          }

          switch(change) {
            case 'deny':
              commit('removeOrder', order);
              break;
            case 'confirm':
              commit('setOrderStatus', { order, status: 'fetching' });
              break;
            case 'fetch':
              commit('setOrderStatus', { order, status: 'arriving' });
              break;
            case 'deliver':
              commit('setOrderStatus', { order, status: 'paying' });
              break;
            case 'receive payment':
              commit('removeOrder', order);
              break;
          }
        })
    },
    orderItem({ commit, state }, { name, cold, amount }) {
      const { x, y } = state.pos;
      const { humanName } = state;
      api({ action: 'order', name, cold, amount, x, y, humanName })
        .then(({ error, token }) => {
          const order = {
            token,
            humanName,
            x, y,
            name,
            amount,
            cold,
            time: new Date,
            status: 'confirming'
          };

          if(error) {
            commit('setOrderError', { error, order })
            return;   
          }

          commit('pushOrder', order)
        })
    },
    cancelOrder({ commit, state }, order) {
      const { token, name } = order;

      api({ action: 'cancel order', token }) 
        .then(({ error, ok }) => {
          if(error) {
            commit('setOrderError', { error, order });
            return { error };
          } 

          commit('removeOrder', order)
          return { ok }
        })
    }
  }
})

store.dispatch('fetchDBs', { attemptAuth: true })
console.log(setInterval(() => store.dispatch('fetchDBs'), 10*1000))

export default store;
