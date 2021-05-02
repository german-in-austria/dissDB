<template>
  <div class="auswertung">
    Tag Auswertung:<br>
    <div class="sel-line">
      <div class="sel-filter">
        <select class="form-control" v-model="filter.arten">
          <option :value="0">Alle Arten</option>
          <option :value="-1">Nur Sätze</option>
          <option :value="-2">Nur Transkripte</option>
        </select>
        <select class="form-control" v-model="filter.ebene" :disabled="selTags.length > 0">
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
            <th v-for="(tData, tIdx) in selTags" :key="'t' + tIdx">{{ tIdx + 1 }}. Tag</th>
            <th>Nächster Tag</th>
          </template>
          <th>Count</th>
          <th>Daten</th>
          <th>Tokens</th>
          <th>Wort Tokens</th>
        </tr>
      </thead>
      <tbody v-if="selTags.length < 1">
        <tr v-for="aTag in filteredTagList" :key="'at' + aTag.eId + '-' + aTag.id" @click="pushTag(aTag)">
          <td :title="'Id: ' + aTag.eId" @click="log(aTag)">{{ tagsData.data.baseCache.tagebenenObj[aTag.eId].t }}</td>
          <td :title="'Id: ' + aTag.id + '\n' + tagsData.data.tagsCache.tags[aTag.id].tl + '\n' + tagsData.data.tagsCache.tags[aTag.id].k">{{ tagsData.data.tagsCache.tags[aTag.id].t }}</td>
          <td>{{ aTag.count }}</td>
          <td>{{ aTag.data.length }}</td>
          <td>{{ aTag.tc.t }}</td>
          <td>{{ aTag.tc.wt }}</td>
        </tr>
      </tbody>
      <tbody v-else-if="filteredSubTags">
        <tr v-for="(aTag, aKey) in filteredSubTags.liste" :key="'ft' + aKey">
          <td :title="'Id: ' + filteredSubTags.eId" @click="log({x: aTag})">{{ tagsData.data.baseCache.tagebenenObj[filteredSubTags.eId].t }}</td>
          <td :title="'Id: ' + filteredSubTags.id + '\n' + tagsData.data.tagsCache.tags[filteredSubTags.id].tl + '\n' + tagsData.data.tagsCache.tags[filteredSubTags.id].k">{{ tagsData.data.tagsCache.tags[filteredSubTags.id].t }}</td>
          <td :class="{'ohne': aKey < 1}" :title="aKey > 0 ? 'Id: ' + aKey + '\n' + tagsData.data.tagsCache.tags[aKey].tl + '\n' + tagsData.data.tagsCache.tags[aKey].k : 'ohne nachfolgenden Tag'">{{ aKey > 0 ? tagsData.data.tagsCache.tags[aKey].t : 'ohne' }}</td>
          <td></td>
          <td>{{ aKey > 0 ? aTag.length : '?' }}</td>
          <td>{{ aKey > 0 ? getTC(aTag).t : '?' }}</td>
          <td>{{ aKey > 0 ? getTC(aTag).wt : '?' }}</td>
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
    log (d) {
      console.log(d)
    },
    getTC (aTag) {
      let c = {
        t: 0,
        wt: 0
      }
      aTag.forEach(t => {
        if (t.c) {
          c.t += t.c.t
          c.wt += t.c.wt
        }
      })
      return c
    },
    pushTag (tId) {
      this.selTags.push(tId)
    },
    popTag () {
      this.selTags.pop()
    }
  },
  computed: {
    filteredSubTags () {
      if (this.selTags.length) {
        let bd = {}
        let abt = this.selTags[0]
        // console.log(abt)
        Object.keys(abt).forEach(k => {
          if (k !== 'data') {
            bd[k] = abt[k]
          }
        })
        bd.liste = {0: {}}
        // console.log(bd)
        // Nachfolgende Tags ermitteln:
        this.filteredTagList.forEach(ftl => {
          if (ftl.id !== abt.id) {
            let found = []
            ftl.data.forEach(aObj => {
              if (abt.byId[aObj.aid]) {
                abt.byId[aObj.aid].forEach(oObj => {
                  if (oObj && oObj.r + 1 === aObj.r && ((oObj.s && oObj.s === aObj.s) || (oObj.tr && oObj.tr === aObj.tr)) && found.indexOf(aObj) < 0) {
                    found.push(aObj)
                  }
                })
              }
            })
            // console.log(ftl.id, ftl.data, 'found', Object.keys(found).length, found)
            if (found.length > 0) {
              bd.liste[ftl.id] = found
            } else {
              bd.liste[0][ftl.id] = 1
            }
          }
        })
        return bd
      }
      return null
    },
    filteredTagList () {
      let atl = []
      this.data.tagList.forEach(tll => {
        if ((this.selTags.length < 1 && (this.filter.ebene === 0 || tll.eId === this.filter.ebene)) || (this.selTags.length > 0 && tll.eId === this.selTags[0].eId)) {
          let ad = {}
          Object.keys(tll).forEach(k2 => {
            let tlo = tll[k2]
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
            atl.push(ad)
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
.table tbody td.ohne {
  font-style: italic;
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
.sel-tags-remove {
  font-weight: bold;
  background: #fdd;
  cursor: pointer;
}
.sel-tags-remove:hover {
  background: #f33;
  color: #fff;
}
.sel-tags-ebene {
  border-radius: 0 15px 15px 0!important;
  margin-right: 5px!important;
  padding-right: 8px!important;
}
</style>
