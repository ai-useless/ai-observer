<template>
  <q-page :class='[ "flex justify-center", inScratch ? "items-center" : "" ]'>
    <div v-if='inScratch' style='padding-bottom: 64px;'>
      <ScratchFrame />
    </div>
    <div v-else style='width: 100%;'>
      <Conference />
    </div>
  </q-page>
</template>

<script setup lang='ts'>
import { setting } from 'src/localstore'
import { computed } from 'vue'

import ScratchFrame from './ScratchFrame.vue'
import Conference from './Conference.vue'

const inScratch = computed(() => setting.Setting.inScratch())

</script>

<style scoped lang='sass'>
</style>
