<template>
  <div v-if="db.orders.length > 0" class="section">
    <div class="columns is-mobile">
      <div class="column">
        <h1 class="title">Orders</h1>
      </div>
      <div class="column has-text-right">
        <button class="button" @click="showOrders = !showOrders">{{ showOrders ? 'Hide' : 'Show' }}</button>
      </div>
    </div>
    <div v-if="showOrders">
      <div v-if="loadedOnce" class="container order-list">
        <Order v-for="order of db.orders" :order="order" :key="order.token" />
      </div>
      <div v-else>
        loading orders
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import Order from '@/components/Order';

export default {
  name: 'Orders',
  data() {
    return {
      showOrders: true
    } 
  },
  computed: {
    ...mapState([
      'db',
      'loadedOnce'
    ]) 
  },
  components: {
    Order 
  }
}
</script>
