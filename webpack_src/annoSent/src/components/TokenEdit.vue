<template>
  <Modal ref="modal" :modalData="modalData" :blocked="changed" @closed="$emit('closed')">
    <template v-slot:title>Token bearbeiten: <b>{{ token.text }}</b> ({{ token.id }})</template>

    <div class="form-horizontal">
      <div class="form-group">
        <label for="aTokenID" class="col-sm-2 control-label">ID</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenID">{{ token.id }}</p></div>
        <label for="aTokenIDInf" class="col-sm-2 control-label">ID_Inf</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenIDInf">{{ tokenInfModel }}</p></div>
        <label for="aTokenType" class="col-sm-2 control-label">token_type</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenType">{{ token.token_type_id_id }}</p></div>
      </div>
      <div class="form-group">
        <label for="aTokenReihung" class="col-sm-2 control-label">token_reihung</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenReihung">{{ token.token_reihung }}</p></div>
        <label for="aTokenSentenceID" class="col-sm-2 control-label">sentence_id</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenSentenceID">{{ tokenSatzModel }}</p></div>
        <label for="aTokenSequenceInSentence" class="col-sm-2 control-label" title="sequence_in_sentence">seq_in_sentence</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenSequenceInSentence">{{ token.sequence_in_sentence }}</p></div>
      </div>
      <div class="form-group">
        <label for="aTokenEventID" class="col-sm-2 control-label">event_id</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenEventID">{{ tokenEvent }}</p></div>
        <label for="aTokenLikelyError" class="col-sm-2 control-label">likely_error</label>
        <div class="col-sm-2"><p class="form-control-static" id="aTokenLikelyError">{{ token.likely_error ? 'Ja' : 'Nein' }}</p></div>
      </div>
      <div class="form-group">
        <label for="aTokenText" class="col-sm-2 control-label">text</label>
        <div class="col-sm-4"><p class="form-control-static" id="aTokenText">{{ token.text }}</p></div>
        <label for="aTokenOrtho" class="col-sm-2 control-label">ortho</label>
        <div class="col-sm-4"><p class="form-control-static" id="aTokenOrtho">{{ token.ortho }}</p></div>
      </div>
      <div class="form-group">
        <label for="aTokenTextInOrtho" class="col-sm-2 control-label">text_in_ortho</label>
        <div class="col-sm-4"><p class="form-control-static" id="aTokenTextInOrtho">{{ token.text_in_ortho }}</p></div>
        <label for="aTokenfragmentof" class="col-sm-2 control-label">fragment_of</label>
        <div class="col-sm-4"><p class="form-control-static" id="aTokenfragmentof">{{ tokenFragmentOf }}</p></div>
      </div>
      <!-- <div class="form-group" v-if="transcript.aTokens.aTokenFragmenteObj[aToken.pk]"><label class="col-sm-3 control-label">Fragmente</label><div class="col-sm-9"><ul class="form-control-static hflist">
          <li v-for="aToFragKey in transcript.aTokens.aTokenFragmenteObj[aToken.pk]" :key="'aTFO' + aToFragKey">{{ transcript.aTokens.tokensObj[aToFragKey].t }} ({{ aToFragKey }})</li>
      </ul></div></div> -->
      <br><h4><b>Token:</b></h4><hr>
      <div class="form-group">
        <label class="col-sm-2 control-label">Antwort</label>
        <div class="col-sm-10">
          <p class="form-control-static" v-if="token.antworten && token.antworten.length > 0">{{ token.antworten[0].id + (0 > token.antworten[0].id ? ' - Neu' : '') + (token.antworten[0].deleteIt ? ' - Wird gelöscht !!!' : '') }}
            <template v-if="!(token.antworten[0].tags && token.antworten[0].tags.length > 0) && (token.antworten.length !== 0)">
              <button type="button" @click="$set(token.antworten[0], 'deleteIt', true)" class="btn btn-danger btn-xs ml10 mt-5" v-if="!token.antworten[0].deleteIt"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
              <button type="button" @click="$set(token.antworten[0], 'deleteIt', false)" class="btn btn-danger btn-xs ml10 mt-5" v-else><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
            </template>
          </p>
          <button type="button" @click="addTokenAntwort(token.antworten)" class="btn btn-primary" v-else>Antwort erstellen</button>
        </div>
      </div>
      <!-- <template v-if="satzView">
        <hr/>
        <div class="satzview">
          <span :class="sv.class + ' tt' + sv.token.tt" v-for="(sv, svKey) in satzView" :key="'sv' + svKey">{{ transcript.aTokens.getTokenString(sv.token, 't') }}</span>
        </div>
      </template> -->
      <!-- <template v-if="aToken.antworten && !token.antworten[0].deleteIt">
        <hr>
        <Tagsystem :tagsData="tagsData" :tags="token.antworten[0].tags" :http="http" mode="edit"/>
      </template> -->
      <template v-if="tokenSetsBereiche.length > 0">
        <br><h4><b>Tokensets:</b> Bereiche</h4><hr>
        <div v-for="tokenSet in tokenSetsBereiche" :key="'tsb' + tokenSet">
          <div class="form-group">
            <label class="col-sm-2 control-label">TokenSet ID</label>
            <div class="col-sm-4"><p class="form-control-static">{{ tokenSet.id }}</p></div>
            <label class="col-sm-2 control-label">Antwort</label>
            <div class="col-sm-4">
              <p class="form-control-static" v-if="tokenSet.antworten && tokenSet.antworten.length > 0">{{ tokenSet.antworten[0].id + (0 > tokenSet.antworten[0].id ? ' - Neu' : '') + (tokenSet.antworten[0].deleteIt ? ' - Wird gelöscht !!!' : '') }}
                <template v-if="!(tokenSet.antworten[0].tags && tokenSet.antworten[0].tags.length > 0) && (tokenSet.antworten.length !== 0)">
                  <button type="button" @click="$set(tokenSet.antworten[0], 'deleteIt', true)" class="btn btn-danger btn-xs ml10 mt-5" v-if="!tokenSet.antworten[0].deleteIt"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
                  <button type="button" @click="$set(tokenSet.antworten[0], 'deleteIt', false)" class="btn btn-danger btn-xs ml10 mt-5" v-else><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
                </template>
              </p>
              <button type="button" @click="addTokenAntwort(tokenSet.antworten)" class="btn btn-primary" v-else>Antwort erstellen</button>
            </div>
          </div>
        </div>
      </template>
      <template v-if="tokenSetsListen.length > 0">
        <br><h4><b>Tokensets:</b> Listen</h4><hr>
        <div v-for="tokenSet in tokenSetsListen" :key="'tsl' + tokenSet">
          <div class="form-group">
            <label class="col-sm-2 control-label">TokenSet ID</label>
            <div class="col-sm-4"><p class="form-control-static">{{ tokenSet.id }}</p></div>
            <label class="col-sm-2 control-label">Antwort</label>
            <div class="col-sm-4">
              <p class="form-control-static" v-if="tokenSet.antworten && tokenSet.antworten.length > 0">{{ tokenSet.antworten[0].id + (0 > tokenSet.antworten[0].id ? ' - Neu' : '') + (tokenSet.antworten[0].deleteIt ? ' - Wird gelöscht !!!' : '') }}
                <template v-if="!(tokenSet.antworten[0].tags && tokenSet.antworten[0].tags.length > 0) && (tokenSet.antworten.length !== 0)">
                  <button type="button" @click="$set(tokenSet.antworten[0], 'deleteIt', true)" class="btn btn-danger btn-xs ml10 mt-5" v-if="!tokenSet.antworten[0].deleteIt"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
                  <button type="button" @click="$set(tokenSet.antworten[0], 'deleteIt', false)" class="btn btn-danger btn-xs ml10 mt-5" v-else><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
                </template>
              </p>
              <button type="button" @click="addTokenAntwort(tokenSet.antworten)" class="btn btn-primary" v-else>Antwort erstellen</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template v-slot:addButtons>
      <button type="button" class="btn btn-primary" :disabled="!changed" @click="updateTokenData">Speichern</button>
    </template>
    <template v-slot:closeButtonsText>{{ ((changed) ? 'Verwerfen' : 'Schließen') }}</template>
  </Modal>
</template>

<script>
import Modal from './Modal'

export default {
  name: 'TokenEdit',
  props: ['token', 'http', 'tagsData', 'infTrans', 'filterfelder'],
  data () {
    return {
      changed: false
    }
  },
  mounted () {
    console.log(this.token, this.filterfelder)
  },
  methods: {
    updateTokenData () {
      console.log('TODO: updateTokenData()')
    },
    addTokenAntwort (antworten) {
      console.log('TODO: addTokenAntwort()')
    }
  },
  computed: {
    tokenEvent () {
      // TODO: {{ aToken.eObj.s }} - {{ aToken.eObj.e }} - ID: {{ aToken.e }}
      return this.token.event_id_id ? this.token.event_id_id : null
    },
    tokenFragmentOf () {
      // TODO: Text des Tokenfragments ...
      return this.token.fragment_of_id ? 'ID: ' + this.token.fragment_of_id : null
    },
    tokenInfModel () {
      return this.infTrans.data.loaded && this.infTrans.data.infTransObj[this.token.ID_Inf_id] ? this.infTrans.data.infTransObj[this.token.ID_Inf_id].modelStr : this.token.ID_Inf_id
    },
    tokenTransciptModel () {
      return this.infTrans.data.loaded && this.infTrans.data.transcriptsObj[this.token.transcript_id_id] ? this.infTrans.data.transcriptsObj[this.token.transcript_id_id].name : this.token.transcript_id_id
    },
    tokenSatzModel () {
      // TODO: {{ transcript.aSaetze[aToken.s].t }} - ID: {{ aToken.s }}
      return this.token.sentence_id_id ? 'ID: ' + this.token.sentence_id_id : null
    },
    tokenSetsBereiche () {
      let tsb = []
      if (this.token.tokensets && this.token.tokensets.length > 0) {
        this.token.tokensets.forEach((ts) => {
          if (ts.id_bis_token_id) {
            tsb.push(ts)
          }
        }, this)
      }
      return tsb
    },
    tokenSetsListen () {
      let tsb = []
      if (this.token.tokensets && this.token.tokensets.length > 0) {
        this.token.tokensets.forEach((ts) => {
          if (!ts.id_bis_token_id) {
            tsb.push(ts)
          }
        }, this)
      }
      return tsb
    }
  },
  components: {
    Modal
  }
}
</script>

<style scoped>
</style>
