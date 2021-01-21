<template>
  <div class="auswertung">
    Auswertung: Alles geladen ...
    <div v-for="aTag in data.tagList" :key="aTag.id">
      <span class="l-tag" :title="'Id: ' + aTag.id + '\n' + tagsData.data.tagsCache.tags[aTag.id].tl + '\n' + tagsData.data.tagsCache.tags[aTag.id].k">{{ tagsData.data.tagsCache.tags[aTag.id].t }}</span>
      <span class="l-count">{{ aTag.count }}</span>
      <span class="l-test">{{ Object.keys(aTag.data).length }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'auswertung',
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
.l-tag, .l-count {
  width: 150px;
  display: inline-block;
}
</style>
