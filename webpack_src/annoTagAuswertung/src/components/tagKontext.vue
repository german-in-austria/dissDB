<template>
  <div class="auswertung">
    Tag Kontext: {{ data.antwortenListe.length }}<br>
    <ul>
      <li
        v-for="(a, i) in data.antwortenListe.slice(0, 100)" :key="'a' + i"
      >
        {{ a }}
      </li>
    </ul>
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
