<template>
  <div>
    <q-input
      dense
      outlined
      rounded
      placeholder='Discuss with them'
      v-model='topic'
      style='min-width: 600px; max-width: 100%;'
      clearable
    />
  </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue'

// TODO: random initial topic
const topic = ref('')

// TODO: detect if it's a valid topic

</script>
