<template>
  <div>
    <div class="notification has-text-centered is-radiusless" :class="{ 'is-success': db.available, 'is-danger': !db.available }">
      <p>{{ db.available ? 'service available' : 'service unavailable' }}{{ availabilityError ? `: ${availabilityError}` : ''}}</p>
      <p>
        <button v-if="authed" @click="setAvailable(!db.available)" class="button ">{{ db.available ? 'set unavailable' : 'set available'}}</button>
      </p>
    </div>
    <div class="container has-text-left">
      <div class="section has-text-centered">
        <h1 class="title">Sticla</h1>
        <h2 class="subtitle">Progressbar Bar</h2>
      </div>

      <User />
      <template v-if="pos.isSet">
        <Orders />
        <Items />
      </template>
      <div v-else class="notification is-danger is-radiusless">
        set your position before continuing
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

import User from '@/components/User';
import Orders from '@/components/Orders';
import Items from '@/components/Items';

export default {
  name: 'Home',
  data() {
    return {
    }
  },
  computed: {
    ...mapState([
      'db',
      'availabilityError',
      'pos',
      'authed'
    ]),
  },
  methods: {
    ...mapActions([
      'setAvailable',
    ]),
  },
  components: {
    User,
    Orders,
    Items
  }
}
</script>

<style scoped>
</style>
