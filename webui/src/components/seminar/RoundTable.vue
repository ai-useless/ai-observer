<template>
  <div>
    <q-fab
      color='red-8'
      vertical-actions-align='left'
      direction='up'
      padding='8px 16px'
      :disable='inScratch'
      v-model='expand'
    >
      <q-fab-action flat dense v-for='(simulator, index) in simulators' :key='index'>
        <simulator-card
          v-if='simulator.simulator'
          :simulator='simulator.simulator'
          :small='true'
          :avatar-only='true'
          :is-host='simulator.isHost'
        />
        <q-spinner-rings v-if='seminar.Seminar.thinking(simulator.participatorId)' color='red-4' style='margin-left: 8px;' />
        <q-spinner-dots v-if='seminar.Seminar.speaking(simulator.participatorId)' color='red-4' style='margin-left: 8px;' />
      </q-fab-action>
      <template #icon>
        <q-icon :name='inScratch ? "bi-hourglass-split" : "bi-chevron-up"' size='16px' />
      </template>
      <template #label>
        <div class='row'>
          <span>{{ label }}</span>
          <q-icon name='bi-person-circle' style='margin-left: 8px;' />
        </div>
      </template>
    </q-fab>
  </div>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { setting, seminar } from 'src/localstores'
import { dbBridge, entityBridge } from 'src/bridge'
import { dbModel } from 'src/model'

import SimulatorCard from './SimulatorCard.vue'

const inScratch = computed(() => setting.Setting.inScratch())
const label = computed(() => inScratch.value ? 'Preparing ...' : 'Expand')

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])
const expand = ref(true)

watch(_uid, async () => {
  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar
})

watch(_seminar, async () => {
  participators.value = await dbBridge._Participator.participators(_seminar.value.uid)
})

watch(participators, async () => {
  simulators.value = await entityBridge.EParticipator.simulators(participators.value)
})

onMounted(async () => {
  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar
})

</script>

<style scoped lang='sass'>
.q-fab__actions-up
  left: 20px

.q-fab__actions .q-btn
  margin: 0
</style>
