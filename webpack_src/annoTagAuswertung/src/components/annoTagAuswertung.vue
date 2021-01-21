<template>
  <div class="annoTagAuswertung">
    test
  </div>
</template>

<script>
/* global csrf tagsystem */

export default {
  name: 'annoTagAuswertung',
  http: {
    root: '/annotationsdb/annoTagAuswertung',
    headers: {
      'X-CSRFToken': csrf
    },
    emulateJSON: true
  },
  data () {
    return {
    }
  },
  mounted () {
    console.log(csrf, tagsystem)
  },
  methods: {
  },
  components: {
  }
}
</script>

<style>
.annoTagAuswertung {
  margin-top: 30px;
  margin-bottom: 50px;
}
.loading {
  position: absolute;
  left: -15px;
  right: -15px;
  top: -15px;
  bottom: -15px;
  text-align: center;
  color: #000;
  background: rgba(255,255,255,0.75);
  z-index: 1000;
  font-size: 70px;
  padding-top: 250px;
}
</style>
