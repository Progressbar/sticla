import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store';
import api from './api';

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
});

