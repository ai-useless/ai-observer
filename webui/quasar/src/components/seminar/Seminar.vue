<template>
  <q-page class='flex justify-center'>
    <div style='width: 240px;'>
      <Sidebar />
    </div>
    <div style='margin-left: 16px;'>
      <Conference />
    </div>
  </q-page>
</template>

<script setup lang='ts'>

import Conference from './Conference.vue'
import Sidebar from '../sidebar/Sidebar.vue'

</script>

<style scoped lang='sass'>
</style>
