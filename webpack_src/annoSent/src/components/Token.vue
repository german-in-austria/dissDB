<template>
  <button
    :class="'token token-type-' + token.token_type_id_id + (token.fragment_of_id || token.token_type_id_id === 2 ? '' : ' space') + (tokenIsFragment ? ' isfragment' : '') + (nextTokenIsFragment ? ' hasfragment' : '')"
    :title="'id: ' + token.id + '\ntext: ' + token.text + '\ntext_in_ortho: ' + token.text_in_ortho + '\northo: ' + token.ortho + '\ntoken_type_id: ' + token.token_type_id_id"
  >
    <div :class="'mark-tokenset' + (token.tokensets && token.tokensets.length > 0 ? ' has-antwort' : '')" />
    <div :class="'mark-token' + (token.antworten && token.antworten.length > 0 ? ' has-antwort' : '')" />
    <i v-if="!this.token.fragment_of_id && this.token.token_type_id_id !== 2">&nbsp;</i>{{ tokenText }}</button>
</template>

<script>
export default {
  name: 'Token',
  props: ['token', 'tokens'],
  computed: {
    nextToken () {
      let isAToken = false
      let nToken = null
      this.tokens.some((aToken) => {
        if (aToken.id === this.token.id) {
          isAToken = true
        } else if (isAToken) {
          nToken = aToken
          return true
        }
      }, this)
      return nToken
    },
    nextTokenIsFragment () {
      return this.nextToken ? this.nextToken.fragment_of_id : null
    },
    tokenIsFragment () {
      return this.token.fragment_of_id
    },
    tokenText () {
      let aTokenText = (this.token.ortho === null ? this.token.text_in_ortho : this.token.ortho)
      if (this.nextToken && this.nextTokenIsFragment) {
        let foTokenText = (this.nextToken.ortho === null ? this.nextToken.text_in_ortho : this.nextToken.ortho)
        if (aTokenText.substr(aTokenText.length - foTokenText.length) === foTokenText) {
          aTokenText = aTokenText.substr(0, aTokenText.length - foTokenText.length)
        }
      }
      return aTokenText
    }
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<style scoped>
.token {
  position: relative;
  padding: 3px 1px;
  background-color: #fafafa;
  border: 1px solid #fafafa;
  border-radius: 4px;
  margin: -4px 0;
  margin-right: 1px;
}
.token.space {
  margin-left: 5px;
}
.token.isfragment {
  border-left: none;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.token.hasfragment {
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.token:hover, .token:focus {
  background-color: #eef;
  border-color: #ddf;
}
.token > i {
  font-size: 0;
}
.mark-tokenset, .mark-token {
  background-color: #337ab7;
  background-color: #337ab7;
  position: absolute;
  bottom: 1px;
  height: 2px;
  left: 1px;
  width: 50%;
  width: calc(50% - 1px);
  opacity: 0.33;
}
.mark-token {
  background-color: #5cb85c;
  background-color: #5cb85c;
  left: inherit;
  right: 1px;
}
.mark-tokenset.has-antwort, .mark-token.has-antwort {
  opacity: 1;
}

</style>
