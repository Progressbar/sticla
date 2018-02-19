<template>
  <div :id="isInItem ? '' : orderHash" class="box has-text-left">
    <template v-if="isInItem">
      <a :href="`#${orderHash}`">
        #{{orderHash}}
      </a>
    </template>
    <template v-else>
      <div class="columns">
        <div class="column">
          <p>
            <b>item:</b> {{order.name}}
          </p>
          <p>
            <b>amount:</b> {{order.amount}}
          </p>
          <p>
            <b>temperature:</b> {{order.cold ? 'fridge' : 'room'}}
          </p>
          <p>
            <b>price:</b> {{item.price * order.amount}}{{db.currency}} -- {{item.price}}{{db.currency}} each
          </p>
          <p>
            <b>token:</b> {{order.token}}
          </p>
          <p>
            <b>status:</b> {{order.status}}
          </p>
          <p v-if="order.humanName && authed">
            <b>human:</b> {{order.humanName}}
          </p>
        </div>
        <div v-if="authed" class="column is-paddingless map-column">
          <div class="pos-locator" :style="{ left: elementPosX, top: elementPosY }"></div>
          <img ref="map" src="@/assets/map.png" @load="setMapBBox"/>
        </div>
        <div class="column">
          <div class="field is-grouped">
            <template v-if="authed">
              <div class="field">
                <button v-if="order.status === 'confirming'" @click="changeOrderStatus({ order, change: 'confirm' })" class="button is-success">Confirm</button>
                <button v-if="order.status === 'fetching'" @click="changeOrderStatus({ order, change: 'fetch' })" class="button is-success">Fetched</button>
                <button v-if="order.status === 'arriving'" @click="changeOrderStatus({ order, change: 'deliver' })" class="button is-success">Deliver</button>
                <button v-if="order.status === 'paying'" @click="changeOrderStatus({ order, change: 'receive payment' })" class="button is-success">Get Payment</button>
                
                <button @click="changeOrderStatus({ order, change: 'deny' })" class="button is-danger">Deny</button>
              </div>
            </template>
            <template v-else>
              <button class="button is-danger" :disabled="['arriving'].includes(order.status)" @click="cancelOrder(order)">Cancel</button>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'Order',
  props: [ 'order', 'isInItem' ],
  data() {
    return {
      mapBBox: {
        x: 0,
        y: 0,
        w: 0,
        h: 0
      }          
    } 
  },
  computed: {
    ...mapState([
      'db',
      'authed'
    ]),
    ...mapState({
      item(state) {
        return state.db.items.find(({ name: itemName }) => this.order.name === itemName);
      }
    }),
    orderHash() {
      return `order-${this.order.token.replace(/ /g, '-')}` 
    },
    elementPosX() {
      const { w } = this.mapBBox;
      return `${this.order.x * w}px`; 
    },
    elementPosY() {
      this.setMapBBox();
      const { h } = this.mapBBox;
      return `${this.order.y * h}px`; 
    }
  },
  methods: {
    ...mapActions([
      'cancelOrder',
      'changeOrderStatus',
    ]),
    setMapBBox() {
      if(this.$refs.map) {
        const { x, y, width: w, height: h } = this.$refs.map.getBoundingClientRect();
        this.mapBBox = { x, y, w, h };
      }
    }
  }
}
</script>
<style>
.map-column {
  position: relative;
}
</style>
