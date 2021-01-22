<template>
  <div class="auswertung">
    Auswertung:<br>
    <div class="sel-line">
      <div class="sel-filter">
        <select class="form-control" v-model="filter.arten">
          <option :value="0">Alle Arten</option>
          <option :value="-1">Nur Sätze</option>
          <option :value="-2">Nur Transkripte</option>
        </select>
        <select class="form-control" v-model="filter.ebene">
          <option :value="0">Alle Ebene</option>
          <option :value="tagebene.pk"
            v-for="tagebene in tagsData.data.baseCache.tagebenenList"
            :key="'te' + tagebene.pk"
          >{{ tagebene.t }}</option>
        </select>
      </div>
      <div class="sel-tags" v-if="selTags.length > 0">
        <span class="sel-tags-ebene">{{ tagsData.data.baseCache.tagebenenObj[selTags[0].eId].t }}</span>
        <span v-for="(aTag, tIdx) in selTags" :key="'tl' + tIdx">{{ tagsData.data.tagsCache.tags[aTag.id].t }}</span>
        <span @click="popTag()" class="sel-tags-remove">X</span>
      </div>
    </div>
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Ebene</th>
          <th v-if="selTags.length < 1">Tag</th>
          <template v-else>
            <th v-for="(tData, tIdx) in [...selTags, 0]" :key="'t' + tIdx">{{ tIdx + 1 }}. Tag</th>
          </template>
          <th>Count</th>
          <th>Daten</th>
        </tr>
      </thead>
      <tbody v-if="selTags.length < 1">
        <tr v-for="aTag in filteredTagList" :key="'at' + aTag.eId + '-' + aTag.id" @click="pushTag(aTag)">
          <td :title="'Id: ' + aTag.eId">{{ tagsData.data.baseCache.tagebenenObj[aTag.eId].t }}</td>
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
      selTags: [],
      filter: {
        ebene: 0,
        arten: 0
      }
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
    filteredTagList () {
      let atl = {}
      Object.keys(this.data.tagList).forEach(k => {
        if (this.filter.ebene === 0 || this.data.tagList[k].eId === this.filter.ebene) {
          let ad = {}
          Object.keys(this.data.tagList[k]).forEach(k2 => {
            let tlo = this.data.tagList[k][k2]
            if (k2 !== 'data' || this.filter.arten === 0) {
              ad[k2] = tlo
            } else {
              let adl = {}
              Object.keys(tlo).forEach(k3 => {
                let tlod = tlo[k3]
                if ((this.filter.arten === -1 && tlod.s > 0) || (this.filter.arten === -2 && tlod.tr > 0)) {
                  adl[k3] = tlod
                }
              })
              if (Object.keys(adl).length > 0) {
                ad[k2] = adl
              }
            }
          })
          if (ad && ad.data) {
            atl[k] = ad
          }
        }
      })
      return atl
    }
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
.sel-line {
  display: flex;
  align-items: center;
  margin: 15px 0 5px;
}
.sel-filter {
  display: flex;
  align-items: center;
}
.sel-filter .form-control {
  margin-right: 15px;
}
.sel-line > * {
  padding-right: 10px;
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
.sel-tags-ebene {
  border-radius: 0 15px 15px 0;
  margin-right: 5px;
  padding-right: 8px;
}
</style>
