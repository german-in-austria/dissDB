<template>
  <div class="annotagauswertung">
    <div v-if="loading">
      <br>
      Lade ...<br>
      <hr>
      Daten: {{ loadingData ? 'lade ...' : 'geladen!' }}<br>
      Tag Base: {{ tagsData.data.loadingBase ? 'lade ...' : 'geladen!' }}<br>
      Tag Presets: {{ tagsData.data.loadingPresets ? 'lade ...' : 'geladen!' }}<br>
      Tags: {{ tagsData.data.loadingTags ? 'lade ...' : 'geladen!' }}<br>
    </div>
    <auswertung :data="data" :tagsData="tagsData" v-else />
  </div>
</template>

<script>
/* global csrf tagsystem */
import auswertung from './auswertung'

export default {
  name: 'annoTagAuswertung',
  http: {
    root: '/annotationsdb/tagauswertung',
    headers: {
      'X-CSRFToken': csrf
    },
    emulateJSON: true
  },
  data () {
    return {
      loadingData: true,
      tagsData: { data: new tagsystem.TagsystemObject.TagsystemBase(this.$http) },
      data: {}
    }
  },
  mounted () {
    this.getData()
  },
  methods: {
    getData () {
      this.loadingData = true
      this.$http.get('', {params: {get: 'data'}}).then((response) => {
        this.data = response.data
        this.loadingData = false
      }).catch((err) => {
        console.log(err)
        alert('Fehler!')
        this.loadingData = false
      })
    }
  },
  computed: {
    loading () {
      return this.loadingData || this.tagsData.data.loading || this.tagsData.data.loadingBase || this.tagsData.data.loadingPresets || this.tagsData.data.loadingTags
    }
  },
  components: {
    auswertung
  }
}
</script>

<style>
.annotagauswertung {
  margin-top: 30px;
  margin-bottom: 50px;
}
.loading {
  position: absolute;
  left: -15px;
  right: -15px;
  top: -15px;
  bottom: -15px;
  text-align: center;
  color: #000;
  background: rgba(255,255,255,0.75);
  z-index: 1000;
  font-size: 70px;
  padding-top: 250px;
}
</style>
