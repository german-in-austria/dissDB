<template>
  <div class="annotagkontext">
    <div v-if="loading">
      <br>
      Lade ...<br>
      <hr>
      Daten: {{ loadingData ? 'lade ...' : 'geladen!' }}<br>
    </div>
    <tagKontext :data="data" :tagsData="tagsData" v-else />
  </div>
</template>

<script>
import tagKontext from './tagKontext'

export default {
  name: 'annoTagKontext',
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
      // this.loadingData = true
      // this.$root.$http.get('', {params: {get: 'data'}}).then((response) => {
      //   this.data = response.data
      //   this.loadingData = false
      // }).catch((err) => {
      //   console.log(err)
      //   alert('Fehler!')
      //   this.loadingData = false
      // })
      this.loadingData = false
    }
  },
  computed: {
    loading () {
      return this.loadingData || this.tagsData.data.loading || this.tagsData.data.loadingBase || this.tagsData.data.loadingPresets || this.tagsData.data.loadingTags
    }
  },
  components: {
    tagKontext
  }
}
</script>

<style>
.annotagkontext {
  margin-top: 15px;
  margin-bottom: 50px;
}
</style>
