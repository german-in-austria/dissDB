<template>
  <div class="auswertung">
    Tag Kontext: {{ data.antwortenListe.length }}<br>
    <ul>
      <template v-for="(a, i) in data.antwortenListe">
        <li :key="'a' + i" v-if="kUeb || (a.antworten && a.antworten.length > 1)">
          <b>aId: {{ a.data.id_Antwort_id }} - {{ (tagsData.data.baseCache.tagebenenObj[a.data.id_TagEbene_id] || {t: a.data.id_TagEbene_id}).t }}</b> - {{ getTagNames(a.data.t).join(' ') }}
          <ul v-if="a.antworten && a.antworten.length > 1">
            <li
              v-for="(f, i) in a.antworten" :key="'f' + i"
            >
              aId: {{ f.id }}
              <ul v-if="f.tags">
                <li
                  v-for="(t, i) in sortByReihung(f.tags)" :key="'t' + i"
                >
                  <b>{{ (tagsData.data.baseCache.tagebenenObj[i] || {t: i}).t }}</b> - {{ getTagNames(t).join(' ') }}
                </li>
              </ul>
              <div v-else>
                <b>Err</b>
              </div>
            </li>
          </ul>
          <span v-else>
            - <b>Keine Überschneidungen!</b>
          </span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'tagKontext',
  props: ['data', 'tagsData', 'kUeb'],
  data () {
    return {
    }
  },
  mounted () {
    console.log(this.data, this.tagsData)
  },
  methods: {
    getTagNames (t) {
      let tl = []
      if (t && t[0]) {
        if (t[0].tId) {
          tl = t.map(x => (this.tagsData.data.tagsCache.tags[x.tId] || {t: x.tId}).t)
        } else {
          tl = t.map(x => (this.tagsData.data.tagsCache.tags[x] || {t: x}).t)
        }
      }
      return tl
    },
    sortByReihung (x) {
      let y = JSON.parse(JSON.stringify(x))
      y.sort((a, b) => {
        return (a.r > b.r) ? 1 : (a.r < b.r) ? -1 : 0
      })
      let z = {}
      y.forEach(e => {
        if (!z[e.eId]) {
          z[e.eId] = []
        }
        z[e.eId].push(e)
      })
      return z
    }
  },
  computed: {
  },
  components: {
  }
}
</script>

<style>
</style>
