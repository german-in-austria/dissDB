<template>
  <div class="auswertung">
    Tag Kontext: {{ dataP.filter(x => x.antworten.length > 0).length }} ({{ data.antwortenListe.length }}) <button @click="excelExport" class="btn btn-default" style="margin-left: 20px;">XLSX</button><br>
    <br>
    <table class="table" v-if="table">
      <thead>
        <tr>
          <th colspan="4">Suchergebniss</th>
          <th colspan="3">Überschneidung</th>
        </tr>
        <tr>
          <th>trId</th>
          <th>Transkript</th>
          <th>aId</th>
          <th>Tagebene</th>
          <th>Tags</th>
          <th>aId</th>
          <th>Tagebene</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in dataT" :key="'ttr' + i">
          <td v-for="(c, i2) in r" :key="'ttd' + i2">
            {{ c }}
          </td>
        </tr>
      </tbody>
    </table>
    <ul v-else>
      <template v-for="(a, i) in dataP">
        <li :key="'a' + i" v-if="kUeb || (a.antworten && a.antworten.length > 0)">
          <b>aId: {{ a.data.id_Antwort_id }} - {{ (tagsData.data.baseCache.tagebenenObj[a.data.id_TagEbene_id] || {t: a.data.id_TagEbene_id}).t }}</b> - {{ getTagNames(a.data.t).join(' ') }}
          <ul v-if="a.antworten && a.antworten.length > 0">
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
const XLSX = require('xlsx')

export default {
  name: 'tagKontext',
  props: ['data', 'tagsData', 'kUeb', 'table'],
  data () {
    return {
    }
  },
  mounted () {
    console.log({data: this.data, tagsData: this.tagsData, dataP: this.dataP, dataT: this.dataT})
  },
  methods: {
    excelExport () {
      console.log(XLSX)
      var wb = XLSX.utils.book_new()
      wb.Props = {
        Title: 'dissDB',
        Subject: 'Tag Kontext',
        Author: 'dissDB',
        CreatedDate: new Date()
      }
      wb.SheetNames.push('Daten')
      var wsData = [['trId', 'Transkript', 'aId', 'Tagebene', 'Tags', 'aId', 'Tagebene', 'Tags'], ...this.dataT]
      var ws = XLSX.utils.aoa_to_sheet(wsData)
      wb.Sheets['Daten'] = ws
      let filename = 'dissDb_tk_' + this.getDateTimeFormated(true) + '.xlsx'
      XLSX.writeFile(wb, filename, {bookType: 'xlsx', type: 'binary', FS: ';'})
    },
    getDateTimeFormated (file = false) {
      var d = new Date()
      var dT = d.getDate()
      var dM = d.getMonth() + 1
      var dH = d.getHours()
      var dMi = d.getMinutes()
      if (file) {
        return (dT < 10 ? '0' + dT : dT) + '-' + (dM < 10 ? '0' + dM : dM) + '-' + d.getFullYear() + '_' + (dH < 10 ? '0' + dH : dH) + '-' + (dMi < 10 ? '0' + dMi : dMi)
      }
      return (dT < 10 ? '0' + dT : dT) + '.' + (dM < 10 ? '0' + dM : dM) + '.' + d.getFullYear() + ', ' + (dH < 10 ? '0' + dH : dH) + ':' + (dMi < 10 ? '0' + dMi : dMi) + ' Uhr'
    },
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
      if (y) {
        y.sort((a, b) => {
          return (a.r > b.r) ? 1 : (a.r < b.r) ? -1 : 0
        })
      }
      let z = {}
      if (y) {
        y.forEach(e => {
          if (!z[e.eId]) {
            z[e.eId] = []
          }
          z[e.eId].push(e)
        })
      }
      return z
    }
  },
  computed: {
    dataT () {
      let dt = []
      this.dataP.forEach(dp => {
        let adt = [
          dp.transkript.trId,
          dp.transkript.trTxt,
          dp.data.id_Antwort_id,
          this.tagsData.data.baseCache.tagebenenObj[dp.data.id_TagEbene_id].t,
          this.getTagNames(dp.data.t).join(' ')
        ]
        if (dp.antworten.length > 0) {
          dp.antworten.forEach(aa => {
            let st = this.sortByReihung(aa.tags)
            Object.keys(st).forEach(te => {
              dt.push([...adt,
                aa.id,
                this.tagsData.data.baseCache.tagebenenObj[te].t,
                this.getTagNames(st[te]).join(' ')
              ])
            })
          })
        } else if (this.kUeb) {
          dt.push([...adt, '', '', ''])
        }
      })
      dt.sort((a, b) => {
        return (a[1] > b[1]) ? 1 : (a[1] < b[1]) ? -1 : 0
      })
      return dt
    },
    dataP () {
      let dp = []
      this.data.antwortenListe.forEach(a => {
        let x = {
          antworten: a.antworten.filter(b => b.id !== a.data.id_Antwort_id),
          data: a.data,
          tokens: a.tokens,
          transkript: a.transkript
        }
        dp.push(x)
      })
      return dp
    }
  },
  watch: {
  },
  components: {
  }
}
</script>

<style>
</style>
