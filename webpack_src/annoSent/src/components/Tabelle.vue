<template>
  <div class="annosent-tabelle">
    <div class="table-responsive">
      <table class="table table-hover" style="white-space:pre">
        <thead>
          <tr>
            <th>#</th>
            <th v-for="(feldoption, feld) in sichtbareTabellenfelder" :key="'thtf' + feld">{{ feld }}</th>
          </tr>
        </thead>
        <tbody>
          <!-- <tr>
            <th scope="row">{{ forloop.counter }}</th>
            <td>{{ line.adhoc_sentence }}</td>
            <td>{{ line.tokenids }}</td>
            <td>{{ line.infid }}</td>
            <td>{{ line.transid }}</td>
            <td>{{ line.tokreih }}</td>
            <td>{{ line.seqsent }}</td>
            <td>{{ line.sentorig }}</td>
            <td>{{ line.sentorth }}</td>
            <td>{{ line.left_context }}</td>
            <td>{{ line.senttext }}</td>
            <td>{{ line.right_context }}</td>
            <td>{{ line.sentttlemma }}</td>
            <td>{{ line.sentttpos }}</td>
            <td>{{ line.sentsplemma }}</td>
            <td>{{ line.sentsppos }}</td>
            <td>{{ line.sentsptag }}</td>
            <td>{{ line.sentspdep }}</td>
            <td>{{ line.sentspenttype }}</td>
          </tr> -->
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tabelle',
  props: ['tabellenfelder'],
  mounted () {
    console.log(this.tabellenfelder)
  },
  computed: {
    sichtbareTabellenfelder () {
      let sichtbareTabellenfelder = {}
      Object.keys(this.tabellenfelder).forEach(key => {
        if (this.tabellenfelder[key].show) {
          sichtbareTabellenfelder[key] = this.tabellenfelder[key]
        }
      }, this)
      return sichtbareTabellenfelder
    }
  }
}
</script>

<style scoped>
.annosent-tabelle {
  margin-top: 40px;
}
</style>
