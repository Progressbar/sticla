<template>
  <div class="box">
    <div class="media">
      <div class="media-left">
        <img :src="item.imageSrc ? require(`@/assets/item-images/${item.imageSrc}`) : `//lorempizza.com/${100+item.name.charCodeAt(1)}/${100+item.name.charCodeAt(1)}`" class="image is-96x96 item-image" /> 
      </div>
      <div class="media-content">
        <h1 class="item-name">{{ item.name }}</h1>
        <p class="item-price">{{ item.price }}{{ currency }}</p>
        <div class="field">
          <input v-model="amount" type="number" min=1 step=1 class="input">
        </div>
      </div>
    </div>
    <div>
      <div class="field has-addons order-buttons">
        <button @click="attemptOrder({ cold: true })" :disabled="item.location.fridge < amount || !db.available" class="button">Fridge T ({{item.location.fridge}})</button>
        <button @click="attemptOrder({ cold: false })" :disabled="item.location.storage < amount || !db.available" class="button">Room T ({{item.location.storage}})</button>
      </div>
    </div>
    <div v-if="item.orderError || orders.length > 0" class="section">
      <div v-if="item.orderError" class="notification is-danger">
        <button class="delete" @click="removeError"></button>
        {{ item.orderError }}
      </div>
      <div v-if="orders.length > 0">
        <div v-for="order in orders">
          <Order :order="order" :isInItem="true" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapMutations, mapActions } from 'vuex';
import Order from '@/components/Order';

export default {
  name: 'Item',
  props: [ 'item' ],
  data () {
    return {
      amount: 1, 
    }    
  },
  computed: {
    ...mapState([
      'authed',
      'db',
      'loaded'
    ]),
    orders(state) {
      return state.db.orders.filter(({ name: orderName }) => this.item.name === orderName);
    },
    currency: state => state.db.currency,
  },
  methods: {
    ...mapActions([
      'orderItem' 
    ]),
    attemptOrder({ cold }) {
      this.orderItem({
        cold,
        amount: this.amount,
        name: this.item.name
      });
    },
    removeError() {
      this.item.orderError = ''; 
    }
  },
  components: {
    Order 
  }
}
</script>
<style scoped>
.order-buttons {
  margin-top: 10px;
}
.order-buttons > button {
  width: 50%;
}
.item-image {
  object-fit: contain;
}
</style>
