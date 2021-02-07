<template>
  <div class="auswertung">
    Tag Kontext:<br>
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
