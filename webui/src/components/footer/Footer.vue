<template>
  <div class='row items-center' style='padding-bottom: 16px;'>
    <div style='width: 240px;'>
      <RoundTable />
    </div>
    <q-space />
    <TopicInput v-if='!inScratch' />
    <q-space />
    <div style='width: 240px;' class='text-right'>
      <q-avatar class='cursor-pointer' size='24px'>
        <q-img :src='githubLogo' />
      </q-avatar>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { setting } from 'src/localstores'

import RoundTable from '../seminar/RoundTable.vue'
import TopicInput from '../seminar/TopicInput.vue'

import { githubLogo } from 'src/assets'

const inScratch = computed(() => setting.Setting.inScratch())

</script>

<style scoped lang='sass'>
</style>
