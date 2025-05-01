<template>
  <div class='row items-center' style='padding: 8px 0;'>
    <div style='width: 240px;'>
      <RoundTable />
    </div>
    <q-space />
    <TopicInput />
    <q-space />
    <div style='width: 240px;' class='text-right'>
      <q-avatar class='cursor-pointer' size='24px'>
        <q-img :src='githubLogo' />
      </q-avatar>
    </div>
  </div>
</template>

<script setup lang='ts'>

import RoundTable from '../seminar/RoundTable.vue'
import TopicInput from '../seminar/TopicInput.vue'

import { githubLogo } from 'src/assets'

</script>

<style scoped lang='sass'>
</style>
