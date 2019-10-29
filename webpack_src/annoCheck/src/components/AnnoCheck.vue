<template>
  <div class="annocheck">
    <div class="row">
      <div class="col col-md-5">
        Links
      </div>
      <div class="col col-md-4">
        Mitte
      </div>
      <div class="col col-md-3">
        <Filtern :filterfelder="filterfelder" :http="$http" :tagsData="tagsData" :infTrans="infTrans" />
      </div>
    </div>
    <Tabelle :tabellenfelder="tabellenfelder" :eintraege="eintraege" :filterfelder="filterfelder" :http="$http" :tagsData="tagsData" :infTrans="infTrans" ref="tabelle" />
  </div>
</template>

<script>
/* global csrf tagsystem */
import Filtern from './Filtern'
import Tabelle from './Tabelle'

export default {
  name: 'AnnoCheck',
  http: {
    root: '/annotationsdb/annocheck',
    headers: {
      'X-CSRFToken': csrf
    },
    emulateJSON: true
  },
  data () {
    return {
      filterfelder: {
        informant: 0,
        transkript: 0,
        tagebene: 0
      },
      tabellenfelder: {
        'Reihung': { show: true, displayName: 'R' },
        'Transkript': { show: true, displayName: 'Tr.' },
        'tId': { show: false },
        'aInf': { show: true, displayName: 'Inf.', dontSort: true },
        'von_Inf_id': { show: false, displayName: 'iId' },
        'id': { show: true, displayName: 'antId' },
        'antType': { show: true, displayName: 'aT', dontSort: true },
        'zu_Aufgabe_id': { show: false, displayName: 'aufId' },
        'aufBe': { show: true, dontSort: true },
        'aufVar': { show: true, dontSort: true },
        'vSatz': { show: true, displayName: 'vorheriger Satz', dontSort: true },
        'aSaetze': { show: true, displayName: 'Satz', dontSort: true },
        'nSatz': { show: true, displayName: 'nächster Satz', dontSort: true },
        'aOrtho': { show: true, displayName: 'Sätze in Ortho', dontSort: true },
        'aTokensText': { show: true, displayName: 'Ausgewählte Tokens', dontSort: true },
        'aTokens': { show: false, displayName: 'Ausgewählte Tokens (Id)', dontSort: true },
        'Tagebenen': { show: true, displayName: 'Tagebenen', local: true, dontSort: true }
      },
      tagsData: { data: new tagsystem.TagsystemObject.TagsystemBase(this.$http) },
      infTrans: { data: { infTransList: [], infTransObj: {}, transcriptsList: [], transcriptsObj: {}, loaded: false } },
      eintraege: { data: { list: [], tokenSets: {}, selTokenSet: 0 } }
    }
  },
  mounted () {
    window.addEventListener('keyup', this.keyUp)
    window.addEventListener('keydown', this.keyDown)
  },
  methods: {
    keyUp (e) {
      // console.log(e)
    },
    keyDown (e) {
      // console.log(e)
      if (e.ctrlKey) {
        if (e.key === 'd') {    // Auswahl aufheben: Strg + D
          e.preventDefault()
          this.$refs.auswahl.selNone()
        }
      }
    }
  },
  beforeDestroy: function () {
    window.removeEventListener('keyup', this.keyUp)
    window.removeEventListener('keydown', this.keyDown)
  },
  components: {
    Filtern,
    Tabelle
  }
}
</script>

<style>
.annocheck {
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
