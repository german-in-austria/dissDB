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
        'Reihung': { show: true },
        'Transkript': { show: true },
        'tId': { show: true },
        'Informant': { show: true },
        'iId': { show: true },
        'antId': { show: true },
        'antType': { show: true },
        'aufId': { show: true },
        'aufBe': { show: true },
        'aufVar': { show: true },
        'vorheriger Satz': { show: true },
        'Satz': { show: true },
        'nächster Satz': { show: true },
        'Sätze in Ortho': { show: true },
        'Ausgewählte Tokens': { show: true },
        'Ausgewählte Tokens (Id)': { show: true },
        'Tagebenen': { show: true }
        // 'tokenids': { show: false },
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
