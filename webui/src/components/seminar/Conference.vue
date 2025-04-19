<template>
  <div class='row'>
    <q-space />
    <div style='width: 100%; max-width: 960px; max-height: 100%;'>
      <div v-if='showTitle' class='text-grey-9 text-left' style='font-size: 24px; font-weight: 600; padding: 32px 0 16px 0; transition: 500ms;'>
        {{ topic }}
      </div>
      <div v-if='showTitle' class='row' style='transition: 500ms;'>
        <simulator-card v-if='host' :simulator='host.simulator' :small='false' :is-host='true' />
        <div class='flex justify-end items-end' style='margin-left: 24px;'>
          <simulator-card
            :style='{marginLeft: index === 0 ? "0" : "16px"}'
            v-for='(guest, index) in guests'
            :simulator='guest.simulator'
            :small='true'
            :key='index'
            :is-host='false'
          />
        </div>
      </div>
      <q-separator style='margin-top: 16px' />
      <div
        v-if='!displayMessages.length'
        style='margin-top: 16px; font-size: 20px'
        class='text-center text-grey-8'
      >
        <q-spinner-facebook class='text-red-4' size='128px' />
        <div>Host is preparing scripts...</div>
      </div>
      <q-scroll-area
        v-else
        :style='{ height: chatBoxHeight + "px" }'
        ref='chatBox'
        :bar-style='{ width: "2px" }'
        :thumb-style='{ width: "2px" }'
        @mouseenter='autoScroll = false'
        @mouseleave='autoScroll = true'
      >
        <div style='margin-top: 16px;'>
          <q-chat-message
            v-for='(message, index) in displayMessages'
            :key='index'
            :name='$t(message.simulator.name) + " | " + message.participator.role + " | " + message.model.name'
            :avatar='message.simulator.avatar'
            :stamp='message.datetime'
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
            <div v-html='message.message' style='line-height: 1.5em;' />
          </q-chat-message>
          <q-resize-observer @resize='onChatBoxResize' />
        </div>
      </q-scroll-area>
    </div>
    <Outline v-if='outline' :json='outline' style='margin-left: 16px; margin-top: 160px;' :active-index='0' />
    <q-space />
  </div>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { seminar } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { useI18n } from 'vue-i18n'
import { QScrollArea } from 'quasar'

import SimulatorCard from './SimulatorCard.vue'
import Outline from './Outline.vue'

const { t } = useI18n({ useScope: 'global' })

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const chatBox = ref<QScrollArea>()
const chatBoxHeight = ref(0)
const showTitle = ref(true)
const autoScroll = ref(true)

const topic = computed(() => _seminar.value?.topic)
const host = computed(() => simulators.value.find((el) => el.participatorId === participators.value.find((el) => el.role === dbModel.Role.HOST)?.id))
const guests = computed(() => simulators.value.filter((el) => participators.value.find((_el) => _el.id === el.participatorId && _el.role === dbModel.Role.GUEST)))

interface Message {
  round: number
  message: string
  participator: dbModel.Participator
  simulator: dbModel.Simulator
  model: dbModel.Model
  datetime: string
  timestamp: number
  audio: string
  duration: number
}

const displayMessages = ref([] as Message[])
const waitMessages = ref([] as Message[])
const typingMessage = ref(undefined as unknown as Message)
const typingIndex = ref(0)
const lastRound = ref(0)
const requesting = ref(false)
const eSeminar = ref(undefined as unknown as entityBridge.ESeminar)
const outline = ref(undefined as unknown as Record<string, unknown>)

const typingInterval = ref(80)
const typingTicker = ref(-1)

const calculateTypingInterval = () => {
  if (typingMessage.value.audio?.length) {
    const interval = Math.ceil(typingMessage.value?.duration * 1000 / typingMessage.value.message?.length)
    typingInterval.value = interval
  }
}

const typing = () => {
  if (!typingMessage.value && !waitMessages.value.length) return

  // If we have a message in typing, finish it
  if (typingMessage.value && typingIndex.value < typingMessage.value.message.length) {
    displayMessages.value[displayMessages.value.length - 1].message = typingMessage.value.message.slice(0, typingIndex.value)
    typingIndex.value += 1
    return
  }

  if (!waitMessages.value.length) return

  typingMessage.value = waitMessages.value[0]
  typingIndex.value = 0
  waitMessages.value = waitMessages.value.slice(1)
  seminar.Seminar.speak(typingMessage.value.participator.id as number)

  calculateTypingInterval()
  window.clearInterval(typingTicker.value)
  typingTicker.value = window.setInterval(typing, typingInterval.value)

  displayMessages.value.forEach((el) => {
    const timestamp = timestamp2HumanReadable(el.timestamp)
    el.datetime = t(timestamp.msg, { VALUE: timestamp.value })
  })

  if (typingMessage.value.round === lastRound.value && !requesting.value && eSeminar.value.shouldNext()) {
    void eSeminar.value.nextGuests()
    requesting.value = true
  }

  displayMessages.value.push({
    ...typingMessage.value,
    message: ''
  })
}

const playAudio = async (base64Data: string) => {
  try {
    const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, '')

    const byteCharacters = atob(cleanBase64)
    const byteArrays = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays[i] = byteCharacters.charCodeAt(i)
    }
    const blob = new Blob([byteArrays], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      await playPromise
    }
  } catch (error) {
    console.error('load audio failed:', error)
  }
}

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

watch(typingMessage, () => {
  if (!typingMessage.value.audio?.length) return
  const audio = typingMessage.value.audio
  void playAudio(audio)
})

const onMessage = async (participatorId: number, message: string, round: number, audio: string, duration: number) => {
  seminar.Seminar.stopThink(participatorId)

  const participator = await dbBridge._Participator.participator(participatorId) as dbModel.Participator
  const timestamp = timestamp2HumanReadable(Date.now())

  lastRound.value = round
  requesting.value = false

  waitMessages.value.push({
    round,
    message,
    participator,
    simulator: await dbBridge._Simulator.simulator(participator?.simulatorId) as dbModel.Simulator,
    model: await dbBridge._Model.model(participator.modelId) as dbModel.Model,
    timestamp: Date.now(),
    datetime: t(timestamp.msg, { VALUE: timestamp.value }),
    audio,
    duration
  })

  waitMessages.value = waitMessages.value.map((el) => {
    const timestamp = timestamp2HumanReadable(el.timestamp)
    return { ...el, datetime: t(timestamp.msg, { VALUE: timestamp.value }) }
  })
}

const onThinking = (participatorId: number) => {
  seminar.Seminar.startThink(participatorId)
}

const onOutline = (json: Record<string, unknown>) => {
  outline.value = json
}

const onChatBoxResize = (size: { height: number }) => {
  if (autoScroll.value) chatBox.value?.setScrollPosition('vertical', size.height, 300)
  showTitle.value = size.height < chatBoxHeight.value - 84 - 89 - 60
}

const historyMessages = (): Map<number, string[]> => {
  const messages = new Map<number, string[]>()

  displayMessages.value.forEach((el) => {
    const _messages = messages.get(el.round) || []
    _messages.push(el.message)
    messages.set(el.round, _messages)
  })
  waitMessages.value.forEach((el) => {
    const _messages = messages.get(el.round) || []
    _messages.push(el.message)
    messages.set(el.round, _messages)
  })

  return messages
}

onMounted(async () => {
  chatBoxHeight.value = window.innerHeight - 106

  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar

  eSeminar.value = new entityBridge.ESeminar(_seminar.value, onMessage, onThinking, onOutline, historyMessages)
  await eSeminar.value.start()

  typingTicker.value = window.setInterval(typing, 40)
})

onBeforeUnmount(() => {
  eSeminar.value?.stop()
  if (typingTicker.value) window.clearInterval(typingTicker.value)
})
</script>

<style scoped lang='sass'>
::v-deep .q-markdown
  pre
    white-space: pre-wrap
    word-wrap: break-word
    background: none
</style>
