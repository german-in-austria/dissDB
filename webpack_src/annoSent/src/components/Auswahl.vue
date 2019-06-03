<template>
  <div class="annosent-auswahl form-horizontal">
    <div class="form-group">
      <label for="seltokensets" class="col-sm-4 control-label">Token Set</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="eintraege.data.selTokenSet" id="seltokensets">
          <option value="0">Auswählen</option>
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
  </div>
</template>

<script>
export default {
  name: 'Auswahl',
  props: ['eintraege', 'filterfelder', 'http'],
  data () {
    return {
    }
  },
  mounted () {
    // console.log(this.eintraege.data.tokenSets)
  },
  methods: {
  }
}
</script>

<style scoped>
</style>
