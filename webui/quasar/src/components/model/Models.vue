<template>
  <div class='full-height full-width'>
    <q-scroll-area
      ref='chatBox'
      :bar-style='{ width: "2px" }'
      :thumb-style='{ width: "2px" }'
      class='q-mt-xs cursor-pointer full-height full-width'
    >
      <div v-for='(_model, index) in models' :key='index'>
        <ModelCard :model='_model' />
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup lang='ts'>
import { computed, onMounted } from 'vue'
import { model } from 'src/localstores'

import ModelCard from './ModelCard.vue'

const models = computed(() => model.Model.models())

onMounted(() => {
  model.Model.getModels()
})

</script>
