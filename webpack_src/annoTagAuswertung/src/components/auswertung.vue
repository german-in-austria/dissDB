<template>
  <div class="auswertung">
    Auswertung:<br>
    <div class="sel-tags" v-if="selTags.length > 0">
      <span v-for="(tId, tIdx) in selTags" :key="'tl' + tIdx">{{ tagsData.data.tagsCache.tags[tId].t }}</span>
      <span @click="popTag()" class="sel-tags-remove">X</span>
    </div>
    <table class="table table-hover">
      <thead>
        <tr>
          <th v-if="selTags.length < 1">Tag</th>
          <template v-else>
            <th v-for="(tData, tIdx) in [...selTags, 0]" :key="'t' + tIdx">{{ tIdx + 1 }}. Tag</th>
          </template>
          <th>Count</th>
          <th>Daten</th>
        </tr>
      </thead>
      <tbody v-if="selTags.length < 1">
        <tr v-for="aTag in data.tagList" :key="aTag.id" @click="pushTag(aTag.id)">
          <td :title="'Id: ' + aTag.id + '\n' + tagsData.data.tagsCache.tags[aTag.id].tl + '\n' + tagsData.data.tagsCache.tags[aTag.id].k">{{ tagsData.data.tagsCache.tags[aTag.id].t }}</td>
          <td>{{ aTag.count }}</td>
          <td>{{ Object.keys(aTag.data).length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'auswertung',
  props: ['data', 'tagsData'],
  data () {
    return {
      selTags: []
    }
  },
  mounted () {
    console.log(this.data, this.tagsData)
  },
  methods: {
    pushTag (tId) {
      this.selTags.push(tId)
    },
    popTag () {
      this.selTags.pop()
    }
  },
  computed: {
  },
  components: {
  }
}
</script>

<style>
.table {
  width: inherit!important;
}
.table tbody td {
  cursor: pointer;
}
.sel-tags {
  margin: 15px 0 5px;
}
.sel-tags > span {
  margin: 0 3px;
  padding: 2px 5px;
  border: 1px solid;
  border-radius: 5px;
}
span.sel-tags-remove {
  font-weight: bold;
  background: #fdd;
  cursor: pointer;
}
span.sel-tags-remove:hover {
  background: #f33;
  color: #fff;
}
</style>
