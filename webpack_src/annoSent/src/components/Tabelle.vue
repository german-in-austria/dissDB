<template>
  <div class="annosent-tabelle">
    <div class="clearfix">
      <div class="form-inline float-left">
        <div class="form-group">
          <label for="annosent-tabelle-seite">Seite</label>
          <div class="input-group spinner">
            <input type="text" v-model="seite" min="1" :max="maxSeiten" class="form-control" id="annosent-tabelle-seite">
            <div class="input-group-btn-vertical">
              <button class="btn btn-default" type="button" @click="seite < maxSeiten ? seite++ : false" :disabled="seite >= maxSeiten"><i class="glyphicon glyphicon-chevron-up"></i></button>
              <button class="btn btn-default" type="button" @click="seite > 1 ? seite-- : false" :disabled="seite <= 1"><i class="glyphicon glyphicon-chevron-down"></i></button>
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
        <button class="btn btn-default" type="button"><span class="glyphicon glyphicon-eye-open"></span></button>
      </div>
    </div>
    <div class="table-responsive">
      <table class="table table-hover" style="white-space:pre">
        <thead>
          <tr>
            <th>#</th>
            <th v-for="(feldoption, feld) in sichtbareTabellenfelder" :key="'thtf' + feld">{{ feld }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(eintrag, key) in eintraege" :key="'ez' + eintrag">
            <th scope="row">{{ lSeite * eintraegeProSeite + key + 1 }}</th>
            <td v-for="(feldoption, feld) in sichtbareTabellenfelder" :key="'ez' + eintrag + 'thtf' + feld">{{ eintrag[feld] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="loading" v-if="loading">Lade ...</div>
  </div>
</template>

<script>
/* global _ */
export default {
  name: 'Tabelle',
  props: ['tabellenfelder', 'http', 'tagsData'],
  data () {
    return {
      seite: 1,
      lSeite: 0,
      zaehler: 0,
      eintraegeProSeite: 50,
      eintraege: [],
      loading: false
    }
  },
  computed: {
    aSeite () {
      return this.seite - 1
    },
    maxSeiten () {
      return Math.ceil(this.zaehler / this.eintraegeProSeite)
    },
    sichtbareTabellenfelder () {
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
    reload: _.debounce(function () {
      if (!this.loading) {
        this.loading = true
        this.http.post('', {
          getEntries: true,
          seite: this.aSeite,
          eps: this.eintraegeProSeite
        }).then((response) => {
          console.log(response.data)
          this.eintraege = response.data.eintraege
          this.zaehler = response.data.zaehler
          this.lSeite = response.data.seite
          this.seite = this.lSeite + 1
          this.loading = false
        }).catch((err) => {
          console.log(err)
          alert('Fehler!')
          this.loading = false
        })
      }
    }, 100)
  },
  watch: {
    eintraegeProSeite () {
      this.reload()
    },
    seite (nVal) {
      if (isNaN(nVal)) {
        this.seite = parseInt(nVal.replace(/\D/, ''))
      } else {
        if (this.maxSeiten < 1) {
          this.seite = 1
        } else {
          this.seite = this.seite < 1 ? 1 : (this.seite > this.maxSeiten ? this.maxSeiten : this.seite)
        }
      }
      if (this.lSeite !== this.aSeite) {
        this.reload()
      }
    }
  }
}
</script>

<style scoped>
.annosent-tabelle {
  position: relative;
  margin-top: 40px;
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
}
.spinner {
  width: 100px;
}
.spinner input {
  text-align: right;
}
.input-group-btn-vertical {
  position: relative;
  white-space: nowrap;
  width: 17px;
  vertical-align: middle;
  display: table-cell;
}
.input-group-btn-vertical > .btn {
  display: block;
  float: none;
  width: 100%;
  max-width: 100%;
  padding: 8px;
  margin-left: -1px;
  position: relative;
  border-radius: 0;
}
.input-group-btn-vertical > .btn:first-child {
  border-top-right-radius: 4px;
}
.input-group-btn-vertical > .btn:last-child {
  margin-top: -2px;
  border-bottom-right-radius: 4px;
}
.input-group-btn-vertical i {
  position: absolute;
  top: 0;
  left: 1px;
}
.input-group-btn-vertical > .btn:last-child i {
  top: 2px;
}
td {
  white-space: nowrap;
}
</style>
