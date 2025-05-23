<template>
  <div class='row'>
    <div style='width: 960px; max-height: 100%;'>
      <div class='bg-gradient-blue text-center text-white flex justify-center items-center q-pb-lg' style='height: 220px'>
        <div class='full-width' style='font-size: 32px; font-weight: 600; padding: 32px 0 16px 0; transition: 500ms;'>
          {{ topic }}
        </div>
        <div class='row' style='transition: 500ms;'>
          <simulator-card v-if='host?.simulator' :simulator='host.simulator' :small='false' :is-host='true' />
          <div class='flex justify-end items-end' style='margin-left: 24px;'>
            <simulator-card
              :style='{marginLeft: index === 0 ? "0" : "16px"}'
              v-for='(guest, index) in guests.filter((el) => el.simulator)'
              :simulator='guest.simulator'
              :small='true'
              :key='index'
              :is-host='false'
            />
          </div>
        </div>
      </div>
      <div style='width: 100%; height: calc(100% - 220px - 4px);' class='bg-grey-2'>
        <div v-if='!displayMessages.length' class='full-width flex justify-center items-center' style='height: 100%; width: min(100%, 600px);'>
          <div
            style='margin-top: 16px; font-size: 20px;'
            class='text-center text-grey-8 flex justify-center items-center'
          >
            <div>
              <q-spinner-facebook class='text-red-4' size='128px' />
              <div>主持人正在准备台本，请稍候...</div>
            </div>
          </div>
        </div>
        <q-scroll-area
          v-else
          :style='{ height: chatBoxHeight + "px" }'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          @mouseenter='autoScroll = false'
          @mouseleave='autoScroll = true'
          class='q-mt-xs bg-grey-2'
        >
          <div style='margin-top: 16px;'>
            <div v-for='(message, index) in displayMessages' :key='index' class='bg-grey-2 q-px-lg'>
              <q-chat-message
                v-if='!message.subTopicTitle'
                :key='index'
                :name='message.simulator.simulator + " | " + message.participator.role + " | " + message.model.name'
                :avatar='message.simulator.simulator_avatar_url'
                :stamp='message.datetime'
                :text='[message.message]'
                text-color='grey-9'
                style='line-height: 24px;'
              >
                <template #name>
                  <div style='padding-bottom: 4px; line-height: 24px;' class='row'>
                    <div>
                      {{ message.simulator.simulator + " | " + message.participator.role + " | " + message.model.name }}
                    </div>
                    <q-img :src='message.model.author_logo_url' width='24px' fit='contain' style='margin-left: 8px;' />
                    <q-img :src='message.model.vendor_logo_url' width='24px' fit='contain' style='margin-left: 8px;' />
                    <q-img :src='message.model.model_logo_url' width='24px' fit='contain' style='margin-left: 8px;' />
                    <div class='single-line-nowrap' style='max-width: 280px;'>
                      | {{ message.simulator.origin_personality }}
                    </div>
                  </div>
                </template>
                <div v-html='message.message' style='line-height: 1.5em;' />
              </q-chat-message>
              <div v-else class='text-black text-bold text-center' style='font-size: 32px; margin: 64px 0'>
                {{ message.subTopic }}
              </div>
            </div>
            <q-resize-observer @resize='onChatBoxResize' />
          </div>
        </q-scroll-area>
      </div>
    </div>
    <Outline v-if='outline' :json='outline' style='margin-left: 16px; margin-top: 40px;' :active-topic='activeTopic || ""' />
  </div>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { model, seminar, setting, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { QScrollArea } from 'quasar'
import { purify } from 'src/utils'
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'

import SimulatorCard from './SimulatorCard.vue'
import Outline from './Outline.vue'
import { seminarWorker } from 'src/worker'
import { useRouter } from 'vue-router'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const chatBox = ref<QScrollArea>()
const chatBoxHeight = ref(0)
const autoScroll = ref(true)

const topic = computed(() => _seminar.value?.topic)
const host = computed(() => simulators.value.find((el) => el.participatorId === participators.value.find((el) => el.role === dbModel.Role.HOST)?.id))
const guests = computed(() => simulators.value.filter((el) => participators.value.find((_el) => _el.id === el.participatorId && _el.role === dbModel.Role.GUEST)))

interface Message extends MessageBase {
  round: number
  participator: dbModel.Participator
  simulator: simulator._Simulator
  model: model._Model
  subTopicTitle: boolean
  subTopic: string
}

const displayMessages = ref([] as Message[])
const lastDisplayMessage = ref(undefined as unknown as Message)
const waitMessages = ref(new Map<string, Message>())
const lastWaitMessage = ref(undefined as unknown as Message)
const incomingMessageIndex = ref(0)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const lastRound = ref(0)
const requesting = ref(false)
const eSeminar = ref(undefined as unknown as entityBridge.ESeminar)
const outline = ref(undefined as unknown as Record<string, unknown>)
const activeTopic = ref('')
const lastTopic = ref(undefined as unknown as string)
const audioPlayer = ref(undefined as unknown as AudioPlayer)
const enablePlay = ref(false)

const typingInterval = ref(80)
const typingTicker = ref(-1)

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, enablePlay.value, typingTicker.value, typingInterval.value, () => {
    lastDisplayMessage.value = undefined as unknown as Message
  }).then((rc) => {
    if (typingMessage.value.round >= lastRound.value - 1 && !requesting.value && eSeminar.value.shouldNext()) {
      void eSeminar.value.nextGuests(lastTopic.value || lastWaitMessage.value?.subTopic || typingMessage.value.subTopic)
      requesting.value = true
    }

    if (!rc) return

    if (rc.audioPlayer) audioPlayer.value = rc.audioPlayer
    if (rc.lastDisplayMessage) {
      lastDisplayMessage.value = rc.lastDisplayMessage
    }
    if (rc.typingInterval) {
      typingInterval.value = rc.typingInterval
      typingTicker.value = window.setInterval(typing, typingInterval.value)
    }
    if (rc.typingMessage) typingMessage.value = rc.typingMessage

    typingMessageIndex.value = rc.typingMessageIndex || typingMessageIndex.value

    if (typingMessage.value) {
      seminar.Seminar.speak(typingMessage.value.participator.id as number)
      if (typingMessage.value?.subTopic !== activeTopic.value) {
        displayMessages.value.push({
          ...typingMessage.value,
          subTopicTitle: true
        })
        activeTopic.value = typingMessage.value?.subTopic
      }
    }
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
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

const strip = (html: string): string => {
  return html
    .replace(/<!DOCTYPE html[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<head[^>]*>/gi, '')
    .replace(/<\/head>/gi, '')
    .trim()
}

const onMessage = async (subTopic: string, participatorId: number, message: string, round: number, audio: string) => {
  seminar.Seminar.stopThink(participatorId)

  const participator = await dbBridge._Participator.participator(participatorId) as dbModel.Participator
  const timestamp = timestamp2HumanReadable(Date.now())

  requesting.value = false

  // Discard topic after conclude: order here is important
  const messages = [...(typingMessage.value ? [typingMessage.value] : []), ...displayMessages.value, ...waitMessages.value.values()]
  if (
    messages.length &&
    messages[messages.length - 1]?.subTopic !== subTopic &&
    messages.findIndex((el) => el.subTopic === subTopic) >= 0
  ) {
    console.log('Discard message', subTopic, message)
    return
  }

  lastRound.value = round
  lastTopic.value = subTopic

  const index = incomingMessageIndex.value++

  waitMessages.value.set(`${subTopic}-${index}`, {
    round,
    message: strip(purify.purifyThink(message)),
    participator,
    simulator: await dbBridge._Simulator.simulator(participator?.simulatorId) as simulator._Simulator,
    model: await dbBridge._Model.model(participator.modelId) as model._Model,
    timestamp: Date.now(),
    datetime: timestamp,
    audio,
    subTopicTitle: false,
    subTopic,
    index
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
}

const historyMessages = (): Map<string, seminarWorker.HistoryMessage[]> => {
  const messages = new Map<string, seminarWorker.HistoryMessage[]>()

  displayMessages.value.slice(0, displayMessages.value.length - 1).filter((el) => el.message.length && !el.subTopicTitle).forEach((el) => {
    const _messages = messages.get(el.subTopic) || []
    _messages.push({
      participatorId: el.participator.id as number,
      content: el.simulator.simulator + ' 的观点: ' + purify.purifyText(el.message)
    })
    messages.set(el.subTopic, _messages)
  })
  waitMessages.value.forEach((el) => {
    const _messages = messages.get(el.subTopic) || []
    _messages.push({
      participatorId: el.participator.id as number,
      content: purify.purifyText(el.message)
    })
    messages.set(el.subTopic, _messages)
  })

  return messages
}

const router = useRouter()

onMounted(async () => {
  setting.Setting.setCurrentMenu('observer')

  chatBoxHeight.value = window.innerHeight - 220 - 4

  if (!_uid.value) {
    void router.push({ path: '/seminar/guests' })
    return
  }
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
