<template>
  <div class="annosent-suchen row">
    <div class="col col-md-6">
      <div class="form-horizontal">
        <div class="form-group" v-for="suchfeld in suchfelder" :key="'sl-' + suchfeld.name">
          <label :for="'suche-' + suchfeld.name" class="col-sm-2 control-label">{{ suchfeld.name }}</label>
          <div class="col-sm-10">
            <div class="input-group">
              <input type="text" v-model="suchfeld.value" class="form-control" :id="'suche-' + suchfeld.name">
              <span class="input-group-btn">
                <button class="btn btn-primary" type="button">Suchen</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col col-md-offset-1 col-md-5">
      <div class="form-horizontal">
        <div class="form-group" v-for="suchfeld in suchfelder" :key="'slm-' + suchfeld">
          <label :for="'kannmuss-' + suchfeld.name" class="col-sm-4 control-label">Methode</label>
          <div class="col-sm-8">
            <div class="input-group">
              <select class="form-control" v-model="suchfeld.kannmuss" :id="'kannmuss-' + suchfeld.name" style="width:35%">
                <option value="kann">kann</option>
                <option value="muss">muß</option>
              </select>
              <select class="form-control" v-model="suchfeld.methode" :id="'methode-' + suchfeld.name" style="width:65%">
                <option value="ci">case-insensetiv</option>
                <option value="cs">case-sensetiv</option>
                <option value="regex" disabled>RegEx</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Suchen',
  props: ['suchfelder'],
  mounted () {
    console.log(this.suchfelder)
  }
}
</script>

<style scoped>
</style>
