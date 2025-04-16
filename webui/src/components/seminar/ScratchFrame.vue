<template>
  <div class='text-center'>
    <h3 class='text-grey-9'>
      What would you like to dig ?
    </h3>
    <q-input
      rounded
      outlined
      v-model='topic'
      placeholder='Key in any topic you are interesting in'
      type='textarea'
      style='width: 800px;'
    />
    <div style='margin-top: 24px;'>
      <q-btn
        rounded
        flat
        label='Random topic'
        no-caps
        class='text-grey-7 border'
      />
      <q-btn
        rounded
        flat
        label='History topic'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
      <q-btn
        rounded
        flat
        label='The World War II'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
      <q-btn
        rounded
        flat
        label='Big Countries Batter'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue'

const topic = ref('')

</script>

<style scoped lang='sass'>
.border
  border: 1px solid $red-3
</style>
