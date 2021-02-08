<template>
  <div class="auswertung">
    Tag Kontext: {{ data.antwortenListe.length }}<br>
    {{ data.antwortenListe }}
  </div>
</template>

<script>
export default {
  name: 'tagKontext',
  props: ['data', 'tagsData'],
  data () {
    return {
    }
  },
  mounted () {
    console.log(this.data, this.tagsData)
  },
  methods: {
  },
  computed: {
  },
  components: {
  }
}
</script>

<style>
</style>
