<template>
  <div class='row items-center' style='padding-bottom: 16px;'>
    <RoundTable />
    <q-space />
    <TopicInput v-if='!inScratch' />
    <q-space />
    <q-avatar class='cursor-pointer' size='24px'>
      <q-img :src='githubLogo' />
    </q-avatar>
  </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { setting } from 'src/localstore'

import RoundTable from '../seminar/RoundTable.vue'
import TopicInput from '../seminar/TopicInput.vue'

import { githubLogo } from 'src/assets'

const inScratch = computed(() => setting.Setting.inScratch())

</script>

<style scoped lang='sass'>
</style>
