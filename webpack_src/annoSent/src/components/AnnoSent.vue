<template>
  <div class="annosent">
    <div class="row">
      <div class="col col-md-8">
        <Suchen :suchfelder="suchfelder" />
      </div>
      <div class="col col-md-offset-1 col-md-3">
        <Filtern :filterfelder="filterfelder" :http="$http" :tagsData="tagsData" />
      </div>
    </div>
    <Tabelle :tabellenfelder="tabellenfelder" :suchfelder="suchfelder" :filterfelder="filterfelder" :http="$http" :tagsData="tagsData" />
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
        { name: 'ttpos', value: '', kannmuss: 'kann', methode: 'ci' },
        { name: 'sptag', value: '', kannmuss: 'kann', methode: 'ci' }
      ],
      filterfelder: {
        informant: 0,
        transkript: 0,
        tagebene: 0
      },
      tabellenfelder: {
        'adhoc_sentence': { show: true },
        'tokenids': { show: false },
        'infid': { show: true },
        'transid': { show: true },
        'tokreih': { show: false },
        'seqsent': { show: false },
        'sentorig': { show: true },
        'sentorth': { show: true },
        'left_context': { show: true },
        'senttext': { show: true },
        'right_context': { show: true },
        'sentttlemma': { show: true },
        'sentttpos': { show: true },
        'sentsplemma': { show: true },
        'sentsppos': { show: true },
        'sentsptag': { show: true },
        'sentspdep': { show: true },
        'sentspenttype': { show: false }
      },
      tagsData: { data: new tagsystem.TagsystemObject.TagsystemBase(this.$http) }
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
