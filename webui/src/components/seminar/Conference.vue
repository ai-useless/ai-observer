<template>
  <div class='row'>
    <q-space />
    <div style='width: 100%; max-width: 800px;'>
      <div class='text-grey-9 text-left' style='font-size: 24px; font-weight: 600; padding: 32px 0 16px 0;'>
        {{ topic }}
      </div>
      <div class='row'>
        <simulator-card v-if='host' :simulator='host' :small='false' />
        <div class='flex justify-end items-end' style='margin-left: 24px;'>
          <simulator-card
            :style='{marginLeft: index === 0 ? "0" : "16px"}'
            v-for='(guest, index) in guests'
            :simulator='guest'
            :small='true'
            :key='index'
          />
        </div>
      </div>
    </div>
    <q-space />
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { seminar } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'

import SimulatorCard from './SimulatorCard.vue'

import { seminarWorker } from 'src/worker'
import { SendMessage } from '../../localstores/seminar'
import { Platform } from 'quasar'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as dbModel.Simulator[])

const topic = computed(() => _seminar.value?.topic)
const host = computed(() => simulators.value.find((el) => el.id === participators.value.find((el) => el.role === dbModel.Role.HOST)?.simulatorId))
const participatorIds = computed(() => participators.value.map((el) => el.simulatorId))
const guestIds = computed(() => participators.value.filter((el) => el.role === dbModel.Role.GUEST).map((el) => el.simulatorId))
const guests = computed(() => simulators.value.filter((el) => guestIds.value.includes(el.id as number)))

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

const onStartConference = () => {
  console.log('topic.value: ', topic.value)
  if (!topic.value) return

  const seminarId = _seminar.value.id || 1
  const participatorId = 1
  const prompts = [{
    role: 'user',
    content: topic.value
  } as SendMessage]
  console.log('-----seminarId: ', seminarId)
  seminarWorker.SeminarWorker.send(seminarWorker.SeminarEventType.CHAT_REQUEST, {
    seminarId: seminarId,
    participatorId: participatorId,
    prompts: prompts
  })
}

const onChatRequest = (payload: seminarWorker.ChatResponsePayload) => {
  const _response = payload.response
  console.log('_response: ', _response)
}

onMounted(async () => {
  console.log(Platform.is)
  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
  console.log('_seminar.value: ', _seminar.value)
  seminarWorker.SeminarWorker.on(seminarWorker.SeminarEventType.CHAT_RESPONSE, onChatRequest as seminarWorker.ListenerFunc)
  onStartConference()
})

onBeforeUnmount(() => {
  seminarWorker.SeminarWorker.off(seminarWorker.SeminarEventType.CHAT_RESPONSE, onChatRequest as seminarWorker.ListenerFunc)
})
</script>

<style scoped lang='sass'>
</style>
