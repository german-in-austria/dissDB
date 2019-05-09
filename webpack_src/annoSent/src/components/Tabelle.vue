<template>
  <div class="annosent-tabelle">
    <div class="clearfix">
      <div class="form-inline float-left">
        <div class="form-group">
          <label for="annosent-tabelle-seite">Seite</label>
          <div class="input-group">
            <div class="input-group-btn">
              <button class="btn btn-default" type="button" @click="seite > 1 ? seite-- : false" title="Vorherige Seite" :disabled="seite <= 1"><span class="glyphicon glyphicon-chevron-left"></span></button>
            </div>
            <input type="text" v-model="seite" min="1" :max="maxSeiten" class="form-control" id="annosent-tabelle-seite">
            <div class="input-group-btn">
              <button class="btn btn-default" type="button" @click="seite < maxSeiten ? seite++ : false" title="Nächste Seite" :disabled="seite >= maxSeiten"><span class="glyphicon glyphicon-chevron-right"></span></button>
            </div>
          </div>
          <b> / {{ maxSeiten }}</b> - Einträge: <b>{{ zaehler.toLocaleString('de-DE') }}</b>
        </div>
      </div>
      <div class="form-inline float-right">
        <div class="form-group">
          <label for="annosent-tabelle-eps">Einträge pro Seite</label>
          <select class="form-control" v-model="eintraegeProSeite" id="annosent-tabelle-eps">
            <option :value="anz" v-for="anz in [10, 25, 50, 100, 250]" :key="'eps' + anz">{{ anz }}</option>
          </select>
        </div>
        <button @click="zeigeSpaltenAuswahl = !zeigeSpaltenAuswahl" @blur="spaltenAuswahlBlur" ref="zeigeSpaltenAuswahlBtn" class="btn btn-default" type="button" title="Ansicht"><span class="glyphicon glyphicon-eye-open"></span></button>
        <div class="zsa" v-if="zeigeSpaltenAuswahl" ref="zeigeSpaltenAuswahl">
          <button v-for="(feldoption, feld) in tabellenfelder" :key="'vthtf' + feld" @blur="spaltenAuswahlBlur" ref="zeigeSpaltenAuswahlBtns" @click="feldoption.show = !feldoption.show" :class="feldoption.show ? 'zsa-show' : ''"><span :class="'glyphicon glyphicon-eye-' + (feldoption.show ? 'open' : 'close')"></span> {{ feld }}</button>
        </div>
      </div>
    </div>
    <div class="table-responsive">
      <table class="table table-hover" style="white-space:pre">
        <thead>
          <tr>
            <th>#</th>
            <th v-for="(feldoption, feld) in sichtbareTabellenfelder" :key="'thtf' + feld" :title="feldoption.sortby || feld">
              <span v-if="feldoption.local && !feldoption.sortby">{{ feldoption.displayName || feld }}</span>
              <button @click="spalteSortieren(feldoption.sortby || feld)" class="sort-btn" v-else>{{ feldoption.displayName || feld }} <span :class="'glyphicon glyphicon-sort-by-attributes' + (spaltenSortierung.asc ? '' : '-alt')" v-if="spaltenSortierung.spalte === (feldoption.sortby || feld)"></span></button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(eintrag, key) in eintraege" :key="'ez' + eintrag">
            <th scope="row">{{ lSeite * eintraegeProSeite + key + 1 }}</th>
            <td v-for="(feldoption, feld) in sichtbareTabellenfelder" :key="'ez' + eintrag + 'thtf' + feld">{{ feldoption.local ? fxFeld(eintrag, feld) : eintrag[feld] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="text-right">Anfrage Dauer: {{ (ladeZeit / 1000).toFixed(2) }} Sekunden</div>
    <div class="loading" v-if="loading">Lade ...</div>
  </div>
</template>

<script>
/* global _ Popper */
export default {
  name: 'Tabelle',
  props: ['tabellenfelder', 'suchfelder', 'filterfelder', 'http', 'tagsData', 'infTrans'],
  data () {
    return {
      seite: 1,
      lSeite: 0,
      zaehler: 0,
      eintraegeProSeite: 50,
      ladeZeit: 0.0,
      ladeZeitStart: 0.0,
      eintraege: [],
      loading: false,
      zeigeSpaltenAuswahl: false,
      popper: null,
      spaltenSortierung: { spalte: 'adhoc_sentence', asc: true },
      rereload: false
    }
  },
  computed: {
    aSeite () {
      return this.seite - 1
    },
    maxSeiten () {
      return Math.ceil(this.zaehler / this.eintraegeProSeite)
    },
    sichtbareTabellenfelder () {    // Liste der Spalten die nicht ausgeblendet sind
      let sichtbareTabellenfelder = {}
      Object.keys(this.tabellenfelder).forEach(key => {
        if (this.tabellenfelder[key].show) {
          sichtbareTabellenfelder[key] = this.tabellenfelder[key]
        }
      }, this)
      return sichtbareTabellenfelder
    }
  },
  mounted () {
    console.log(this.tabellenfelder)
    this.reload()
  },
  methods: {
    debouncedReload: _.debounce(function () {   // Einträge verzögert laden
      this.reload()
    }, 300),
    reload: _.debounce(function () {  // Einträge laden
      if (!this.loading) {
        this.rereload = false
        this.loading = true
        this.ladeZeitStart = performance.now()
        this.http.post('', {
          getEntries: true,
          seite: this.aSeite,
          eps: this.eintraegeProSeite,
          filter: JSON.stringify({ inf: this.filterfelder.informant, trans: this.filterfelder.transkript }),
          suche: JSON.stringify(this.suchfelder),
          sortierung: JSON.stringify(this.spaltenSortierung)
        }).then((response) => {
          // console.log(response.data)
          this.eintraege = response.data.eintraege
          this.zaehler = response.data.zaehler
          this.lSeite = response.data.seite
          this.seite = this.lSeite + 1
          this.ladeZeit = performance.now() - this.ladeZeitStart
          this.loading = false
          if (this.rereload) { this.reload() }
        }).catch((err) => {
          console.log(err)
          alert('Fehler!')
          this.ladeZeit = performance.now() - this.ladeZeitStart
          this.loading = false
          if (this.rereload) { this.reload() }
        })
      } else {
        this.rereload = true
      }
    }, 100),
    fxFeld (eintrag, feld) {
      if (feld === 'inf') {
        return this.infTrans.data.loaded && this.infTrans.data.infTransObj[eintrag.infid] ? this.infTrans.data.infTransObj[eintrag.infid].modelStr : eintrag.infid
      }
      if (feld === 'trans') {
        return this.infTrans.data.loaded && this.infTrans.data.transcriptsObj[eintrag.transid] ? this.infTrans.data.transcriptsObj[eintrag.transid].name : eintrag.transid
      }
      return 'Unbekannt: ' + feld
    },
    spalteSortieren (feld) {
      if (this.spaltenSortierung.spalte === feld) {
        this.spaltenSortierung.asc = !this.spaltenSortierung.asc
      } else {
        this.spaltenSortierung = { spalte: feld, asc: true }
      }
      this.reload()
    },
    spaltenAuswahlBlur: _.debounce(function () {
      this.$nextTick(() => {
        if (this.$refs.zeigeSpaltenAuswahlBtns && this.$refs.zeigeSpaltenAuswahlBtns.indexOf(document.activeElement) < 0) {
          this.zeigeSpaltenAuswahl = false
        }
      })
    }, 20),
    close () {
      this.$emit('close')
    }
  },
  watch: {
    zeigeSpaltenAuswahl (nVal) {
      this.$nextTick(() => {
        if (nVal) {
          this.popper = new Popper(this.$refs.zeigeSpaltenAuswahlBtn, this.$refs.zeigeSpaltenAuswahl, {
            placement: 'right-start',
            modifiers: {
              offset: { offset: '0,-100%' }
            }
          })
        } else if (this.popper) {
          this.popper.destroy()
        }
      })
    },
    'filterfelder.informant' () { this.reload() },
    'filterfelder.transkript' () { this.reload() },
    eintraegeProSeite () { this.reload() },
    seite (nVal) {
      this.seite = this.maxSeiten < 1 ? 1 : isNaN(nVal) ? parseInt(nVal.replace(/\D/, '')) : this.seite < 1 ? 1 : (this.seite > this.maxSeiten ? this.maxSeiten : this.seite)
      if (this.lSeite !== this.aSeite) {
        this.debouncedReload()
      }
    }
  }
}
</script>

<style scoped>
.annosent-tabelle {
  position: relative;
  margin-top: 10px;
  margin-bottom: 150px;
}
.form-inline > .form-group {
  margin-right: 10px;
}
.form-inline > .form-group > label {
  margin-right: 5px;
}
.float-left {
  float: left;
}
#annosent-tabelle-seite {
  text-align: right;
  width: 70px;
  padding-left: 0;
  padding-right: 0;
  text-align: center;
}
td {
  white-space: nowrap;
}
.zsa {
  background: #fff;
  box-shadow: 3px 3px 5px rgba(0,0,0,0.3);
  border: 1px solid #ccc;
  padding: 15px;
}
.zsa > button {
  background: none;
  border: none;
  display: block;
  width: 100%;
  text-align: left;
  color: #999;
}
.zsa > button.zsa-show {
  color: #333;
}
.sort-btn {
  background: none;
  border: none;
  display: block;
  width: 100%;
  text-align: left;
  padding: 0;
}
</style>
