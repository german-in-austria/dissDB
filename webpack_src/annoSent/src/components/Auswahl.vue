<template>
  <div class="annosent-auswahl form-horizontal">
    <div class="form-group">
      <label for="seltokensets" class="col-sm-3 control-label">Token Set</label>
      <div class="col-sm-9">
        <select class="form-control" v-model="eintraege.data.selTokenSet" id="seltokensets">
          <option value="0">Auswählen ({{ Object.keys(eintraege.data.tokenSets).length }})</option>
          <option value="-1" v-if="filterfelder.bearbeitungsmodus === 'auswahl'">Neues Token Set</option>
          <option
            :value="aTokenSet.id"
            v-for="aTokenSet in eintraege.data.tokenSets"
            :key="'ts' + aTokenSet.id"
          >
            ID: {{ aTokenSet.id + ', ' + (aTokenSet.id_von_token_id ? 'Bereich' : 'Liste' ) + (aTokenSet.antworten ? ', Antworten vorhanden' : '' ) }}
          </option>
        </select>
      </div>
    </div>
    <template v-if="filterfelder.bearbeitungsmodus === 'direkt'">
      <template v-if="satz[eintraege.data.selTokenSet] && Object.keys(satz[eintraege.data.selTokenSet]).length > 0 && eintraege.data.tokenSets[eintraege.data.selTokenSet]">
        <div :class="'satzview' + (!satzOpen ? ' closed' : '')">
          <div>
            <span
              v-for="sToken in satz[eintraege.data.selTokenSet]"
              :key="'st' + sToken.id"
              :title="'ID: ' + sToken.id"
              :class="'s-tok s-tok-tt' + sToken.token_type_id_id + ((getFirstObjectOfValueInPropertyOfArray(eintraege.data.tokenSets[eintraege.data.selTokenSet].tokentoset, 'id_token_id', sToken.id, false)) ? ' s-tok-act' : '')"
            >{{
                ((!sToken.fragment_of_id && sToken.token_type_id_id !== 2) ? ' ' : '') +
                (sToken.ortho === null ? (!sToken.text_in_ortho ? sToken.text : sToken.text_in_ortho) : sToken.ortho)
            }}</span>
          </div>
          <button @click="satzOpen = !satzOpen"><span :class="'glyphicon glyphicon-chevron-' + (satzOpen ? 'up' : 'down')" aria-hidden="true"></span></button>
        </div>
      </template>
    </template>
    <template v-else-if="filterfelder.bearbeitungsmodus === 'auswahl'">
      <div class="form-group" v-if="eintraege.data.selTokenSet > 0">
        <div class="col-sm-offset-3 col-sm-9">
          <button class="form-control-static btn btn-primary w100" @click="selTokensOfSet" title="Momentane Auswahl verwerfen und Tokens des aktuellen Sets auswählen.">Token auswählen</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'Auswahl',
  props: ['eintraege', 'filterfelder', 'http'],
  data () {
    return {
      satz: {},
      satzOpen: false
    }
  },
  mounted () {
    // console.log(this.eintraege.data.tokenSets)
    this.getTokenSetsSatz()
  },
  methods: {
    selTokensOfSet () {
      if (this.eintraege.data.selTokenSet > 0 && this.eintraege.data.tokenSets[this.eintraege.data.selTokenSet] && this.eintraege.data.tokenSets[this.eintraege.data.selTokenSet].tokentoset) {
        this.eintraege.data.list.forEach((aEintrag) => {
          this.$set(aEintrag, 'selected', [])
          this.eintraege.data.tokenSets[this.eintraege.data.selTokenSet].tokentoset.forEach((tsid) => {
            aEintrag.tokens.forEach((aToken) => {
              if (tsid.id_token_id === aToken.id) {
                aEintrag.selected.push(aToken.id)
              }
            }, this)
          }, this)
        }, this)
      }
    },
    getTokenSetsSatz () {
      if (this.eintraege.data.tokenSets && Object.keys(this.eintraege.data.tokenSets).length > 0) {
        this.http.post('', {
          getTokenSetsSatz: true,
          tokenSetsIds: Object.keys(this.eintraege.data.tokenSets)
        }).then((response) => {
          // console.log('getTokenSetsSatz', response.data)
          this.satz = response.data.aTokenSetSatz
          Object.keys(this.satz).forEach((tsid) => {
            this.satz[tsid].sort((a, b) => (a.token_reihung > b.token_reihung) ? 1 : ((b.token_reihung > a.token_reihung) ? -1 : 0))
          }, this)
        }).catch((err) => {
          console.log(err)
          alert('Fehler!')
        })
      }
    },
    getFirstObjectOfValueInPropertyOfArray (arr, property, value, returnObj) {
      let rObj = ((returnObj) ? {} : null)
      if (Array.isArray(arr)) {
        arr.some(function (aVal, aKey) {
          if (aVal[property] && aVal[property] === value) {
            rObj = aVal
            return true
          }
        })
      }
      return rObj
    }
  },
  watch: {
    'eintraege.data.tokenSets' (nVal) {
      this.$nextTick(() => {
        this.getTokenSetsSatz()
        if (!this.eintraege.data.tokenSets[this.eintraege.data.selTokenSet]) {
          this.eintraege.data.selTokenSet = 0
        }
      })
    }
  }
}
</script>

<style scoped>
.satzview {
  position: relative;
  padding: 0;
  margin: 10px 0px;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}
.satzview > div {
  padding: 10px 50px;
}
.satzview.closed > div {
  overflow-y: auto;
  max-height: 140px;
}
.satzview > button {
  position: absolute;
  top: -8px;
  left: 10px;
  background: #ddd;
  border: none;
  border-radius: 100%;
  width: 15px;
  height: 15px;
  font-size: 10px;
  padding: 0;
}
.s-tok {
  color: #888;
}
.s-tok-act {
  font-weight: bold;
  color: #333;
}
</style>
