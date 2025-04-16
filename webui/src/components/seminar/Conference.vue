<template>
  <div class='row'>
    <q-space />
    <div style='width: 100%; max-width: 960px;'>
      <h3 class='text-grey-9 text-left'>
        {{ topic }}
      </h3>
      <div>
        Host: {{ host?.name }}
      </div>
    </div>
    <q-space />
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { seminar } from 'src/localstore'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch } from 'vue'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as dbModel.Simulator[])

const topic = computed(() => _seminar.value?.topic)
const host = computed(() => simulators.value.find((el) => el.id === participators.value.find((el) => el.role === dbModel.Role.HOST)?.simulatorId))

watch(_uid, async () => {
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
})

watch(_seminar, async () => {
  participators.value = await dbBridge._Participator.participators(_seminar.value.id as number)
})

watch(participators, async () => {
  simulators.value = await dbBridge._Simulator.simulators(participators.value.map((el) => el.id as number))
})

onMounted(async () => {
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
})

</script>

<style scoped lang='sass'>
</style>
