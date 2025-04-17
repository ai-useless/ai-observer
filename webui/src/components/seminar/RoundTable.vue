<template>
  <div>
    <q-fab
      color='red-8'
      vertical-actions-align='left'
      direction='up'
      padding='8px 16px'
      :disable='inScratch'
    >
      <q-fab-action color='grey-4' v-for='(simulator, index) in simulators' :key='index'>
        <SimulatorCard :simulator='simulator' :small='true' :avatar-only='true' />
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
import { setting, seminar } from 'src/localstore'
import { dbBridge } from 'src/bridge'
import { dbModel } from 'src/model'

import SimulatorCard from './SimulatorCard.vue'

const inScratch = computed(() => setting.Setting.inScratch())
const label = computed(() => inScratch.value ? 'Preparing ...' : 'Expand')

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as dbModel.Simulator[])

const participatorIds = computed(() => participators.value.map((el) => el.simulatorId))

watch(_uid, async () => {
  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
})

watch(_seminar, async () => {
  participators.value = await dbBridge._Participator.participators(_seminar.value.uid)
})

watch(participators, async () => {
  simulators.value = await dbBridge._Simulator.simulators(participatorIds.value)
})

onMounted(async () => {
  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
})

</script>
