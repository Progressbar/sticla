<template>
  <nav class="navbar is-black is-fixed-top">
    <div class="navbar-brand"> 
      <router-link to="//progressbar.sk">
        <img class="logo" src="@/assets/logo.png">
      </router-link>
      <router-link to="/" class="navbar-item">
        Home 
      </router-link>
      <a @click="refresh" class="navbar-item">Refresh</a>
      <a v-if="authKeyWorks" @click="toggleLoginStatus" class="navbar-item">{{ authed ? 'Log out' : 'Log in' }}</a>
      <div @click="toggleMenu" class="navbar-burger" :class="{ 'is-active': menuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <div class="navbar-menu" :class="{ 'is-active': menuOpen }">
      <div class="navbar-end">
        <a href="//cowork.progressbar.sk" class="navbar-item">cowork</a>
      </div>
    </div>
  </nav>
</template>
<script>
import { mapState, mapMutations, mapActions } from 'vuex';

export default {
  name: 'Navbar',
  data() {
    return {
      menuOpen: false
    } 
  },
  computed: {
    ...mapState([
      'authed',
      'authKeyWorks',
      'db'
    ]) 
  },
  methods: {
    toggleLoginStatus() {
      this.setAuthentication({ authed: !this.authed, loadDB: true }); 
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen; 
    },
    refresh() {
      this.fetchDBs(); 
    },
    ...mapMutations([
    ]),
    ...mapActions([
      'setAuthentication',
      'setAvailable',
      'fetchDBs'
    ])
  }
}
</script>
<style>
.logo {
  mix-blend-mode: lighten;
  height: 48px;
  padding-left: 10px;
  padding-top: 2px;
  padding-right: 10px;
  display: block;
}  
</style>
