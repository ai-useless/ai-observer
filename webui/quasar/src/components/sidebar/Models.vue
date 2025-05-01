<template>
  <div>
    <div style='font-size: 14px; color: gray;'>
      在线的AGI模型
    </div>
    <q-separator />
    <div style='max-height: 400px; overflow: scroll;'>
      <div v-for='_model in models' :key='_model.name' class='cursor-pointer'>
        <ModelCard :model='_model' />
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { model } from 'src/localstores'
import { computed, onMounted } from 'vue'

import ModelCard from './ModelCard.vue'

const models = computed(() => model.Model.models())

onMounted(() => {
  model.Model.getModels()
})

</script>
