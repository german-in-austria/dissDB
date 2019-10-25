<template>
  <div class="annocheck-filtern form-horizontal">
    <div class="form-group">
      <label for="tagebene" class="col-sm-4 control-label">Tag Ebene</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.tagebene" id="tagebene">
          <option :value="tagebene.pk"
            v-for="tagebene in tagebenenListe"
            :key="'te' + tagebene.pk"
            :disabled="tagebene.count == 0"
          >{{ tagebene.title }}{{ tagebene.count > -1 ? ' - ' + tagebene.count.toLocaleString() : '' }}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="informant" class="col-sm-4 control-label">Informant</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.informant" id="informant">
          <option :value="informant.pk"
            v-for="informant in informantenListe"
            :key="'inf' + informant.pk"
            :disabled="informant.count == 0"
          >{{informant.kuerzelAnonym}}{{ informant.count > -1 ? ' - ' + informant.count.toLocaleString() : '' }}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="transkript" class="col-sm-4 control-label">Transkript</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.transkript" id="transkript">
          <option :value="transcript.pk"
            v-for="transcript in transcriptsListe"
            :key="'ts' + transcript.pk"
            :disabled="transcript.count == 0"
          >{{transcript.name}}{{ transcript.count > -1 ? ' - ' + transcript.count.toLocaleString() : '' }}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <div class="col-sm-offset-4 col-sm-8">
        <div class="form-inline">
          <div class="checkbox">
            <label>
              <input type="checkbox" v-model="showCount"> Zähler anzeigen
            </label>
          </div>
          <div class="checkbox">
            <label class="ml10">
              <input type="checkbox" v-model="showCountTrans" :disabled="!showCount"> Transkript
            </label>
          </div>
        </div>
      </div>
    </div>
    <!-- <div class="form-group">
      <label for="aufgabensets" class="col-sm-4 control-label">Aufgabensets</label>
      <div class="col-sm-8">
        <select class="form-control" id="aufgabensets">
          <option value="0">Alle</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="aufgaben" class="col-sm-4 control-label">Aufgaben</label>
      <div class="col-sm-8">
        <select class="form-control" id="aufgaben">
          <option value="0">Alle</option>
        </select>
      </div>
    </div> -->
    <div class="loading" v-if="loading">Lade ...<div>{{ loadInfos }}</div></div>
  </div>
</template>

<script>
export default {
  name: 'Filtern',
  props: ['filterfelder', 'http', 'tagsData', 'infTrans'],
  data () {
    return {
      loading: false,
      loadInfos: '',
      mvDurchschnitt: 0.0,
      mvLastUpdate: 'Unbekannt ...',
      tagebenenListe: [],
      informantenListe: [],
      transcriptsListe: [],
      showCount: true,
      showCountTrans: false
    }
  },
  computed: {
  },
  mounted () {
    console.log(this.filterfelder)
    this.getFilterData()
  },
  methods: {
    getFilterData () {    // Informationen für Filter laden
      this.loading = true
      this.loadInfos = 'Filter Daten'
      this.http.post('', {
        getFilterData: true,
        showCount: this.showCount,
        showCountTrans: this.showCountTrans,
        filter: JSON.stringify({ inf: this.filterfelder.informant, trans: this.filterfelder.transkript })
      }).then((response) => {
        this.tagebenenListe = response.data['tagEbenen']
        this.informantenListe = response.data['informanten']
        this.transcriptsListe = response.data['transcripts']
        console.log('getFilterData', response.data)
        this.loading = false
      }).catch((err) => {
        console.log(err)
        alert('Fehler!')
        this.loading = false
      })
    }
  },
  watch: {
    'filterfelder.tagebene' () { this.getFilterData() },
    'filterfelder.informant' () { this.getFilterData() },
    'filterfelder.transkript' () { this.getFilterData() },
    showCount () { this.getFilterData() },
    showCountTrans () { this.getFilterData() }
  }
}
</script>

<style scoped>
.annocheck-filtern {
  position: relative;
}
.loading {
  position: absolute;
  left: -10px;
  right: -10px;
  top: -10px;
  bottom: -10px;
  font-size: 50px;
  line-height: 1;
  padding: 25px;
}
.loading > div {
  font-size: 16px;
  line-height: 1;
}
</style>
