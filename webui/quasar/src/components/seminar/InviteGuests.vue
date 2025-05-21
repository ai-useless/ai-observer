<template>
  <div>
    <GuestCard v-for='(participator, index) of participators' :key='index' :participator='participator' />
  </div>
</template>

<script setup lang='ts'>
import { model, simulator } from 'src/localstores'
import { onMounted, ref } from 'vue'
import { dbModel } from 'src/model'

import GuestCard from './GuestCard.vue'

const participatorCount = ref(7)
const participators = ref([] as dbModel.Participator[])

onMounted(() => {
  participatorCount.value = Math.floor(Math.random() * 4) + 6
  for (let i = 0; i < participatorCount.value; i++) {
    participators.value.push(undefined as unknown as dbModel.Participator)
  }

  simulator.Simulator.getSimulators()
  model.Model.getModels()
})

</script>
