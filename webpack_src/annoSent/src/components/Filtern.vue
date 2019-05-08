<template>
  <div class="annosent-filtern form-horizontal">
    <div class="form-group">
      <div class="col-sm-offset-4 col-sm-8">
        <button class="form-control-static btn btn-success w100" @click="loadMatViewData(true)" :title="'Letzter Refresh: ' + mvLastUpdate + ' Uhr, Durchschnittliche Dauer ca. ' + mvDurchschnitt + ' Sekunden'"><b>Refresh Materialized View</b></button>
      </div>
    </div>
    <div class="form-group">
      <label for="informant" class="col-sm-4 control-label">Informant</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.informant" id="informant">
          <option value="0">Alle</option>
          <option :value="informant.pk" v-for="informant in infTransListFiltered" :key="'inf' + informant">{{informant.modelStr}} - {{informant.transcriptsPKs.length}} Transkripte</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="transkript" class="col-sm-4 control-label">Transkript</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.transkript" id="transkript">
          <option value="0">Alle</option>
          <option :value="transcript.pk" v-for="transcript in transcriptsListFiltered" :key="'ts' + transcript">{{transcript.name}}</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="tagebene" class="col-sm-4 control-label">Tag Ebene</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.tagebene" id="tagebene">
          <option value="0">Auswählen</option>
          <option :value="tagebene.pk" v-for="tagebene in tagebenenListe" :key="'te' + tagebene">{{ tagebene.t }}</option>
        </select>
      </div>
    </div>
    <div class="loading" v-if="loading">Lade ...<div>{{ loadInfos }}</div></div>
  </div>
</template>

<script>
export default {
  name: 'Filtern',
  props: ['filterfelder', 'http', 'tagsData'],
  data () {
    return {
      loading: false,
      loadInfos: '',
      mvDurchschnitt: 0.0,
      mvLastUpdate: 'Unbekannt ...',
      infTransList: [],
      infTransObj: {},
      transcriptsList: [],
      transcriptsObj: {}
    }
  },
  computed: {
    tagebenenListe () {
      return this.tagsData.data.ready ? this.tagsData.data.baseCache.tagebenenList : []
    },
    infTransListFiltered () {
      if (this.filterfelder.transkript > 0) {
        let infTransList = []
        this.infTransList.forEach(informant => {
          if (informant.transcriptsPKs.indexOf(this.filterfelder.transkript) > -1) {
            infTransList.push(informant)
          }
        }, this)
        return infTransList
      }
      return this.infTransList
    },
    transcriptsListFiltered () {
      if (this.filterfelder.informant > 0) {
        let transcriptsList = []
        this.transcriptsList.forEach(transcript => {
          if (this.infTransObj[this.filterfelder.informant].transcriptsPKs.indexOf(transcript.pk) > -1) {
            transcriptsList.push(transcript)
          }
        }, this)
        return transcriptsList
      }
      return this.transcriptsList
    }
  },
  mounted () {
    console.log(this.filterfelder)
    this.loadMatViewData()
    this.getTranscriptsInfList()
  },
  methods: {
    getTranscriptsInfList () {
      this.loading = true
      this.loadInfos = ''
      this.http.post('/annotationsdb/startvue', { getTranscriptsInfList: 1 })
        .then((response) => {
          this.infTransList = response.data['informanten']
          this.infTransObj = {}
          for (let aInfKey in this.infTransList) {
            this.infTransList[aInfKey].transcriptsPKs = this.infTransList[aInfKey].transcriptsPKs.filter(function (el) { return el != null })   // Null Werte filtern!
            // Objekt mit PK als Property erstellen
            if (this.infTransList.hasOwnProperty(aInfKey)) {
              let aInf = this.infTransList[aInfKey]
              this.infTransObj[aInf.pk] = aInf
            }
          }
          this.transcriptsList = response.data['transcripts']
          this.transcriptsObj = {}
          for (let aTransKey in this.transcriptsList) {
            // Objekt mit PK als Property erstellen
            if (this.transcriptsList.hasOwnProperty(aTransKey)) {
              let aTrans = this.transcriptsList[aTransKey]
              this.transcriptsObj[aTrans.pk] = aTrans
            }
          }
          // console.log('infTransList', this.infTransList, 'infTransObj', this.infTransObj)
          // console.log('transcriptsList', this.transcriptsList, 'transcriptsObj', this.transcriptsObj)
          this.loading = false
        })
        .catch((err) => {
          console.log(err)
          alert('Fehler!')
          this.loading = false
        })
    },
    loadMatViewData (refresh = false) {
      if (!this.loading || !refresh) {
        if (refresh) {
          this.loading = true
          this.loadInfos = 'Die letzten 5 Aktuallisierungen haben durchschnittlich ' + this.mvDurchschnitt.toFixed(1) + ' Sekunden gedauert ...'
        }
        this.http.post('', {
          getMatViewData: 1,
          refresh: refresh
        }).then((response) => {
          this.mvDurchschnitt = response.data.mvDurchschnitt
          this.mvLastUpdate = response.data.mvLastUpdate
          if (refresh) {
            this.loading = false
          }
        }).catch((err) => {
          console.log(err)
          alert('Fehler!')
          if (refresh) {
            this.loading = false
          }
        })
      }
    }
  }
}
</script>

<style scoped>
.annosent-filtern {
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
