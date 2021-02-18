<template>
  <div class="annotagkontext">
    <div v-if="tagloading">
      <br>
      Warte auf Tagsystem ...
    </div>
    <div v-else>
      <div :class="{'loading-data': loadingData}">
        <div class="tagline">
          <Tagsystem :tagsData="tagsData" :tags="tags" :http="$root.$http" mode="select" style="max-width: 100rem;"/>
          <div class="taginfo">{{ getFlatTags(tags[0].tags) }}</div>
        </div>
        <div class="options">
          <div><div class="checkbox"><label><input v-model="strickt" type="checkbox"> Strickt</label></div></div>
          <div><div class="checkbox"><label><input v-model="kUeb" type="checkbox"> Keine Überschneidungen</label></div></div>
          <button @click="getData" :class="'btn btn-' + ((tags[0] && tags[0].e > 0 && tags[0].tags && tags[0].tags.length > 0) && update ? 'warning' : 'default')" :disabled="!(tags[0] && tags[0].e > 0 && tags[0].tags && tags[0].tags.length > 0)">Laden</button><br>
          <br>
        </div>
      </div>
      <div v-if="loading || loadingData">
        Lade ...<br>
      </div>
      <tagKontext :data="data" :tagsData="tagsData" :kUeb="kUeb" v-else-if="data && data.antwortenListe && data.antwortenListe.length > 0" />
      <div v-else>
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
      data: {},
      update: false,
      strickt: false,
      kUeb: true
    }
  },
  mounted () {
  },
  methods: {
    getData () {
      if (!this.loadingData) {
        this.loadingData = true
        this.update = false
        this.data = {}
        this.$root.$http.get('', {params: {get: 'tagKontext', l: this.getFlatTags(this.tags[0].tags), s: this.strickt}}).then((response) => {
          this.data = response.data
          this.loadingData = false
        }).catch((err) => {
          console.log(err)
          alert('Fehler!')
          this.loadingData = false
        })
      }
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
        // console.log(this.tags)
        // if (this.tags[0] && this.tags[0].e > 0 && this.tags[0].tags && this.tags[0].tags.length > 0) {
        //   this.getData()
        // } else {
        //   this.data = {}
        // }
        this.update = true
      },
      deep: true
    },
    strickt () {
      // if (this.tags[0] && this.tags[0].e > 0 && this.tags[0].tags && this.tags[0].tags.length > 0) {
      //   this.getData()
      // }
      this.update = true
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
.tagline {
  display: flex;
}
.tagline > div {
  flex-grow: 1;
}
.tagline > .taginfo {
  flex-grow: 2;
}
.loading-data {
  opacity: 0.7;
  pointer-events: none;
}
.options > div {
  float: left;
  margin-right: 20px;
}
</style>
