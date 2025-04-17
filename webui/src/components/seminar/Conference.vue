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
      <q-separator style='margin-top: 16px' />
      <div
        v-if='!messages.length'
        style='margin-top: 16px; font-size: 20px'
        class='text-center text-grey-8'
      >
        Host is preparing scripts...
      </div>
      <div v-else style='margin-top: 16px'>
        <q-chat-message
          v-for='(message, index) in messages'
          :key='index'
          :name='$t(message.simulator.name) + " | " + message.participator.role + " | " + message.model.name'
          :avatar='message.simulator.avatar'
          :stamp='message.timestamp'
          :text='[message.message]'
          text-color='grey-9'
          bg-color='grey-2'
        >
          <template #name>
            <div style='padding-bottom: 4px; line-height: 24px;' class='row'>
              <div>
                {{ $t(message.simulator.name) + " | " + message.participator.role + " | " + message.model.name }}
              </div>
              <q-img :src='message.model.authorLogo' width='24px' fit='contain' style='margin-left: 8px;' />
              <q-img :src='message.model.vendorLogo' width='24px' fit='contain' style='margin-left: 8px;' />
              <q-img :src='message.model.modelLogo' width='24px' fit='contain' style='margin-left: 8px;' />
            </div>
          </template>
          <div>
            <q-markdown>
              {{ message.message }}
            </q-markdown>
          </div>
        </q-chat-message>
      </div>
    </div>
    <q-space />
  </div>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { seminar } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { useI18n } from 'vue-i18n'

import SimulatorCard from './SimulatorCard.vue'

const { t } = useI18n({ useScope: 'global' })

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as dbModel.Simulator[])

const topic = computed(() => _seminar.value?.topic)
const host = computed(() => simulators.value.find((el) => el.id === participators.value.find((el) => el.role === dbModel.Role.HOST)?.simulatorId))
const participatorIds = computed(() => participators.value.map((el) => el.simulatorId))
const guestIds = computed(() => participators.value.filter((el) => el.role === dbModel.Role.GUEST).map((el) => el.simulatorId))
const guests = computed(() => simulators.value.filter((el) => guestIds.value.includes(el.id as number)))

interface Message {
  message: string
  participator: dbModel.Participator
  simulator: dbModel.Simulator
  model: dbModel.Model
  timestamp: string
}

const messages = ref([] as Message[])

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

const eSeminar = ref(undefined as unknown as entityBridge.ESeminar)

onMounted(async () => {
  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar

  eSeminar.value = new entityBridge.ESeminar(_seminar.value, async (participatorId: number, message: string) => {
    const participator = await dbBridge._Participator.participator(participatorId) as dbModel.Participator
    const timestamp = timestamp2HumanReadable(Date.now())

    messages.value.push({
      message,
      participator,
      simulator: await dbBridge._Simulator.simulator(participator?.simulatorId) as dbModel.Simulator,
      model: await dbBridge._Model.model(participator.modelId) as dbModel.Model,
      timestamp: t(timestamp.msg, { VALUE: timestamp.value })
    })
  })
  await eSeminar.value.start()
})

onBeforeUnmount(() => {
  eSeminar.value?.stop()
})
</script>

<style scoped lang='sass'>
</style>
