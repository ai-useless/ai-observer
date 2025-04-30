<template>
  <View>
    <View v-for='(_model, index) in models' :key='index' style='border-bottom: 1px solid gray;'>
      <ModelCard :model='_model' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View } from '@tarojs/components'
import { model } from 'src/localstores'
import { onMounted, computed } from 'vue'

import ModelCard from './ModelCard.vue'

const models = computed(() => model.Model.models())

onMounted(() => {
  model.Model.getModels()
})
</script>
