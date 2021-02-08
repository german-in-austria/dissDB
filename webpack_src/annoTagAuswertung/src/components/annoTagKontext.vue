<template>
  <div class="annotagkontext">
    <div v-if="tagloading">
      <br>
      Warte auf Tagsystem ...
    </div>
    <div v-else>
      <Tagsystem :tagsData="tagsData" :tags="tags" :http="$root.$http" mode="select" style="max-width: 100rem;"/>
      {{ getFlatTags(tags[0].tags) }}
      <div v-if="loading">
        Lade ...<br>
      </div>
      <tagKontext :data="data" :tagsData="tagsData" v-else-if="data && data.antwortenListe" />
      <div>
        Keine Daten!
      </div>
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
      loadingData: false,
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
  },
  methods: {
    getData () {
      this.loadingData = true
      this.data = {}
      this.$root.$http.get('', {params: {get: 'tagKontext', l: this.getFlatTags(this.tags[0].tags)}}).then((response) => {
        this.data = response.data
        this.loadingData = false
      }).catch((err) => {
        console.log(err)
        alert('Fehler!')
        this.loadingData = false
      })
      this.loadingData = false
    },
    getFlatTags (tags) {
      let tagList = []
      tags.forEach(t => {
        tagList.push(t.tag)
        if (t.tags && t.tags.length > 0) {
          tagList = [...tagList, ...this.getFlatTags(t.tags)]
        }
      })
      return tagList
    }
  },
  computed: {
    loading () {
      return this.loadingData || this.tagloading
    },
    tagloading () {
      return this.tagsData.data.loading || this.tagsData.data.loadingBase || this.tagsData.data.loadingPresets || this.tagsData.data.loadingTags
    }
  },
  watch: {
    tags: {
      handler () {
        console.log(this.tags)
        if (this.tags[0] && this.tags[0].e > 0 && this.tags[0].tags && this.tags[0].tags.length > 0) {
          this.getData()
        } else {
          this.data = {}
        }
      },
      deep: true
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
