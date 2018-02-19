<template>
  <div class="section">
    <div class="columns is-mobile">
      <div class="column">
        <h1 class="title">Items</h1>
      </div>
      <div class="column">
        <div class="field">
          <div class="control">
            <input v-model="itemFilter" class="input" type="text" placeholder="e.g. club-mate">
          </div>
        </div>
      </div>
    </div>
    <div v-if="itemFilter === 'konami'" class="section">
      <h1 class="title">Login</h1>
      <div class="field has-addons">
        <div class="control">
          <input v-model="authKey" class="input" type="password" placeholder="password">
        </div>
        <div class="control">
          <button @click="attemptAuth" class="button is-info" :class="{'is-loading': loadingAuth}">Auth</button>
        </div>
      </div>
      <div v-if="authError" class="notification is-danger">{{ authError }}</div>
    </div>
    <div v-if="loadedOnce" class="container item-list">
      <template v-if="filteredItems.length > 0">
        <Item v-for="item of filteredItems" :item="item" :key="item.name" />
      </template>
      <div v-else>
        No items match your search
      </div>
    </div>
    <div v-else>
      loading items
    </div>
  </div>
</template>
<script>
import { mapState, mapActions } from 'vuex';
import Item from '@/components/Item';

export default {
  name: 'Home',
  data() {
    return {
      itemFilter: '',
      authKey: localStorage.authKey,
      authError: '',
      loadingAuth: false,
    }
  },
  computed: {
    ...mapState([
      'db',
      'loadedOnce'
    ]),
    filteredItems() {
      if(this.loadedOnce) {
        if(this.itemFilter) {
          return this.db.items.filter(({ name }) => name.includes(this.itemFilter))
        } else {
          return this.db.items; 
        }
      } else {
        return [] 
      }
    }
  },
  methods: {
    ...mapActions([
      'auth',
    ]),
    attemptAuth() {
      this.loadingAuth = true;
      this.auth({ key: this.authKey })
        .then(({ error, ok }) => {
          this.loadingAuth = false;

          if(error) {
            this.authError = error;
            return { error };
          } 

          this.authError = '';
          return { ok }
        })
    }
  },
  components: {
    Item
  }
}
</script>
<style>
.item-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
</style>
