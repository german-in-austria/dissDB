<template>
  <button
    :class="'token token-type-' + token.tt + (token.fo || token.tt === 2 ? '' : ' space') + (tokenIsFragment ? ' isfragment' : '') + (nextTokenIsFragment ? ' hasfragment' : '')"
    :title="'pk: ' + token.pk + '\ntext: ' + token.t + '\ntext_in_ortho: ' + token.to + '\northo: ' + token.o + '\ntoken_type_id: ' + token.tt"
  ><i v-if="!this.token.fo && this.token.tt !== 2">&nbsp;</i>{{ tokenText }}</button>
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
        if (aToken.pk === this.token.pk) {
          isAToken = true
        } else if (isAToken) {
          nToken = aToken
          return true
        }
      }, this)
      return nToken
    },
    nextTokenIsFragment () {
      return this.nextToken ? this.nextToken.fo : null
    },
    tokenIsFragment () {
      return this.token.fo
    },
    tokenText () {
      let aTokenText = (this.token.o === null ? this.token.to : this.token.o)
      if (this.nextToken && this.nextTokenIsFragment) {
        let foTokenText = (this.nextToken.o === null ? this.nextToken.to : this.nextToken.o)
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
.token > i {
  font-size: 0;
}
.token {
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
</style>
