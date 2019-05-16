<template>
  <div class="annosent">
    <div class="row">
      <div class="col col-md-5">
        <Suchen :suchfelder="suchfelder" @suche="$refs.tabelle.reload()" />
      </div>
      <div class="col col-md-4">
      </div>
      <div class="col col-md-3">
        <Filtern :filterfelder="filterfelder" :http="$http" :tagsData="tagsData" :infTrans="infTrans" />
      </div>
    </div>
    <Tabelle :tabellenfelder="tabellenfelder" :suchfelder="suchfelder" :filterfelder="filterfelder" :http="$http" :tagsData="tagsData" :infTrans="infTrans" ref="tabelle" />
  </div>
</template>

<script>
/* global csrf tagsystem */
import Suchen from './Suchen'
import Filtern from './Filtern'
import Tabelle from './Tabelle'

export default {
  name: 'AnnoSent',
  http: {
    root: '/annotationsdb/annosent',
    headers: {
      'X-CSRFToken': csrf
    },
    emulateJSON: true
  },
  data () {
    return {
      suchfelder: [
        { name: 'sentorig', value: '', kannmuss: 'kann', methode: 'ci' },
        { name: 'sentorth', value: '', kannmuss: 'kann', methode: 'ci' },
        { name: 'sentttpos', value: '', kannmuss: 'kann', methode: 'ci' },
        { name: 'sentsptag', value: '', kannmuss: 'kann', methode: 'ci' }
      ],
      filterfelder: {
        informant: 0,
        transkript: 0,
        tagebene: 0
      },
      tabellenfelder: {
        'adhoc_sentence': { show: true, displayName: 'a.s.' },
        'tokenids': { show: false },
        'infid': { show: false },
        'inf': { show: true, local: true, sortby: 'infid' },
        'transid': { show: false },
        'trans': { show: true, local: true, sortby: 'transid' },
        'tagspalte': { show: true, displayName: 'Tag Spalte (Test)', local: true },
        'left_context': { show: true },
        'sentorth': { show: false },
        'sentorth_fx': { show: true, displayName: 'Sentorth (tokenids)', local: true, sortby: 'sentorth' },
        'right_context': { show: true },
        'sentorig': { show: true },
        'tokreih': { show: false },
        'seqsent': { show: false },
        'senttext': { show: true },
        'sentttlemma': { show: false },
        'sentttpos': { show: true },
        'sentsplemma': { show: false },
        'sentsppos': { show: false },
        'sentsptag': { show: true },
        'sentspdep': { show: false },
        'sentspenttype': { show: false }
      },
      tagsData: { data: new tagsystem.TagsystemObject.TagsystemBase(this.$http) },
      infTrans: { data: { infTransList: [], infTransObj: {}, transcriptsList: [], transcriptsObj: {}, loaded: false } }
    }
  },
  components: {
    Suchen,
    Filtern,
    Tabelle
  }
}
</script>

<style>
.annosent {
  margin-top: 30px;
  margin-bottom: 50px;
}
.loading {
  position: absolute;
  left: -20px;
  right: -20px;
  top: -20px;
  bottom: -20px;
  text-align: center;
  color: #000;
  background: rgba(255,255,255,0.75);
  z-index: 1000;
  font-size: 70px;
  padding-top: 250px;
}
</style>
