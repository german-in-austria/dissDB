<template>
  <div id="app">
    <div class="syssel">
      <button @click="sel = 'tags'" :class="'btn btn-default' + (sel==='tags' ? ' active' : '')">Tags</button>
      <button @click="sel = 'kont'" :class="'btn btn-default' + (sel==='kont' ? ' active' : '')">Tagkontext</button>
    </div>
    <div v-if="loading">
      <br>
      Lade ...<br>
      <hr>
      Tag Base: {{ tagsData.data.loadingBase ? 'lade ...' : 'geladen!' }}<br>
      Tag Presets: {{ tagsData.data.loadingPresets ? 'lade ...' : 'geladen!' }}<br>
      Tags: {{ tagsData.data.loadingTags ? 'lade ...' : 'geladen!' }}<br>
    </div>
    <annoTagAuswertung :tagsData="tagsData" v-if="sel === 'tags'"/>
    <annoTagKontext :tagsData="tagsData" v-else-if="sel === 'kont'"/>
  </div>
</template>

<script>
/* global csrf tagsystem */
import annoTagAuswertung from './components/annoTagAuswertung'
import annoTagKontext from './components/annoTagKontext'

export default {
  name: 'App',
  http: {
    root: '/annotationsdb/tagauswertung',
    headers: {
      'X-CSRFToken': csrf
    },
    emulateJSON: true
  },
  data () {
    return {
      sel: null,
      tagsData: { data: new tagsystem.TagsystemObject.TagsystemBase(this.$http) }
    }
  },
  computed: {
    loading () {
      return this.tagsData.data.loading || this.tagsData.data.loadingBase || this.tagsData.data.loadingPresets || this.tagsData.data.loadingTags
    }
  },
  components: {
    annoTagAuswertung,
    annoTagKontext
  }
}
</script>

<style>
.syssel {
  margin-top: 15px;
}
.ml10 {
  margin-left: 10px;
}
.mt-5 {
  margin-top: -5px;
}
</style>
