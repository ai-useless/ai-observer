<template>
  <div>
    <q-input
      dense
      outlined
      rounded
      placeholder='Key in any topic you are interesting in'
      v-model='topic'
      style='min-width: 600px; max-width: 100%;'
    />
  </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue'

const topic = ref('')

</script>
