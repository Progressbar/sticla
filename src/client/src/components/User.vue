<template>
  <div class="container has-text-left">
    <div class="section">
      <div class="columns is-mobile">
        <div class="column">
          <h1 class="title">Settings</h1>
        </div>
        <div class="column has-text-right">
          <button class="button" @click="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
        </div>
      </div>
    </div>
    <div v-if="show" class="container">
      <div class="section">
        <h1 class="title">Position</h1>
        <h2 class="subtitle">Where do I bring the items? Click/tap the map</h2>
        <div class="container">
          <div class="pos-locator" :style="{ top: elementPosY, left: elementPosX }"></div>
          <img ref="map" @load="setMapBBox" @click="setPosFromClick" class="image" src="@/assets/map.png"> 
        </div>
      </div>
      <div class="section">
        <h1 class="title">Username</h1>
        <h2 class="subtitle">(optional) How do I call you?</h2>
        <div class="field">
          <input :value="humanName" @input="updateHumanNameFromEvent" class="input" placeholder="e.g. Jane Smith">
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'User',
  data() {
    return {
      show: true,
      mapBBox: {
        x: 0,
        y: 0,
        w: 1,
        h: 1
      }
    } 
  },
  computed: {
    ...mapState([
      'pos',
      'humanName'
    ]),
    elementPosX() {
      const { w } = this.mapBBox;
      return `${this.pos.x * w}px`; 
    },
    elementPosY() {
      this.setMapBBox();
      const { h } = this.mapBBox;
      return `${this.pos.y * h}px`; 
    },
  },
  methods: {
    ...mapMutations([
      'setPos',
      'updateHumanName'
    ]),
    updateHumanNameFromEvent(e) {
      this.updateHumanName(e.target.value); 
    },
    setMapBBox() {
      if(this.$refs.map) {
        const { x, y, width: w, height: h } = this.$refs.map.getBoundingClientRect();
        this.mapBBox = { x, y, w, h };
      }
    },
    setPosFromClick({ clientX, clientY }) {
      this.setMapBBox();
      const { x, y, w, h } = this.mapBBox;

      this.setPos({ x: (clientX - x) / w, y: (clientY - y) / h });
    }
  }
}
</script>
<style>
.pos-locator {
  position: absolute;
  z-index: 1;
  background-color: rgba(200, 200, 255, .5);
  border: 1px solid #aaf;
  width: 20px;
  height: 20px;
  margin-left: -10px;
  margin-top: -10px;
  border-radius: 10px;

}
</style>
