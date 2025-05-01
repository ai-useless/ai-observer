<template>
  <q-page class='flex justify-center items-center'>
    <div style='width: 240px;'>
      <Sidebar />
    </div>
    <div style='padding-bottom: 64px; margin-left: 16px;'>
      <ScratchFrame />
    </div>
  </q-page>
</template>

<script setup lang='ts'>

import ScratchFrame from '../seminar/ScratchFrame.vue'
import Sidebar from '../sidebar/Sidebar.vue'

</script>

<style scoped lang='sass'>
</style>
