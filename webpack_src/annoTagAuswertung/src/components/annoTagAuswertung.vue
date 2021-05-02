<template>
  <div class="annotagauswertung">
    <div v-if="loading">
      <br>
      Lade ...<br>
      <hr>
      Daten: {{ loadingData ? 'lade ...' : 'geladen!' }}<br>
    </div>
    <auswertung :data="data" :tagsData="tagsData" v-else />
  </div>
</template>

<script>
import auswertung from './auswertung'

export default {
  name: 'annoTagAuswertung',
  props: ['tagsData'],
  data () {
    return {
      loadingData: true,
      data: {}
    }
  },
  mounted () {
    this.getData()
  },
  methods: {
    getData () {
      this.loadingData = true
      this.$root.$http.get('', {params: {get: 'data'}}).then((response) => {
        this.data = response.data
        this.data.tagList.forEach(tl => {
          tl.tc = {t: 0, wt: 0}
          Object.keys(tl.data).forEach(d => {
            tl.data[d].c = {
              t: tl.data[d].tc.t + tl.data[d].tsc.t + tl.data[d].tstc.t,
              wt: tl.data[d].tc.wt + tl.data[d].tsc.wt + tl.data[d].tstc.wt
            }
            tl.tc.t += tl.data[d].c.t
            tl.tc.wt += tl.data[d].c.wt
          })
        })
        console.log(this.data)
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
  margin-top: 15px;
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
