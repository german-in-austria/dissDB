<template>
  <div class="annosent-filtern form-horizontal">
    <div class="form-group">
      <div class="col-sm-offset-4 col-sm-8">
        <a href="?refresh=1" class="form-control-static btn btn-success w100" title="Letzter Refresh: tbl_refreshlog_mat_adhocsentences_last.created_at Uhr{% if tbl_refreshlog_mat_adhocsentences_avg %}, Durchschnittliche Dauer ca. tbl_refreshlog_mat_adhocsentences_avg.total_seconds|floatformat:1 Sekunden{% endif %}"><b>Refresh Materialized View</b></a>
      </div>
    </div>
    <div class="form-group">
      <label for="informant" class="col-sm-4 control-label">Informant</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.informant" id="informant">
          <option value="0">Alle</option>
          <option value="1">xxx</option>
          <option value="2">yyy</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="transkript" class="col-sm-4 control-label">Transkript</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.transkript" id="transkript">
          <option value="0">Alle</option>
          <option value="1">xxx</option>
          <option value="2">yyy</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="tagebene" class="col-sm-4 control-label">Tag Ebene</label>
      <div class="col-sm-8">
        <select class="form-control" v-model="filterfelder.tagebene" id="tagebene">
          <option value="0">Auswählen</option>
          <option value="1">xxx</option>
          <option value="2">yyy</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Filtern',
  props: ['filterfelder'],
  mounted () {
    console.log(this.filterfelder)
  }
}
</script>

<style scoped>
</style>
