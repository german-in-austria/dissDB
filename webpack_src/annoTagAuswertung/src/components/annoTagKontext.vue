<template>
  <div class="annotagkontext">
    <div v-if="loading">
      <br>
      Lade ...<br>
      <hr>
      Daten: {{ loadingData ? 'lade ...' : 'geladen!' }}<br>
    </div>
    <div v-else>
      <Tagsystem :tagsData="tagsData" :tags="tags" :http="$root.$http" mode="select" style="max-width: 100rem;"/>
      <tagKontext :data="data" :tagsData="tagsData" />
    </div>
  </div>
</template>

<script>
/* global tagsystem */
import tagKontext from './tagKontext'

export default {
  name: 'annoTagKontext',
  props: ['tagsData'],
  data () {
    return {
      loadingData: true,
      tags: [
        {
          e: 0,
          tags: []
        }
      ],
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
  watch: {
    tags () {
      console.log(this.tags)
    }
  },
  components: {
    tagKontext,
    Tagsystem: tagsystem.TagsystemVue
  }
}
</script>

<style>
.annotagkontext {
  margin-top: 15px;
  margin-bottom: 50px;
}
</style>
