<template>
  <div style='max-width: 100%; width: 800px; height: 100vh; overflow: scroll;' class='hide-scrollbar'>
    <div style='height: 280px'>
      <q-img :src='backgroundImage' style='width: 100%; height: 280px;' fit='cover' />
      <div style='margin-top: -138px; background-color: rgba(128, 128, 128, 0.8); opacity: 0.8; padding: 8px 32px; text-align: center;'>
        <div style='font-size: 16px; font-weight: 600; color: white; padding: 0 0 4px 0; min-height: 18px; max-height: 36px; overflow: scroll;'>
          {{ currentTopic }}
        </div>
        <div style='display: flex; padding: 8px 0 0 0; color: white; justify-content: center; align-items: center;'>
          <div v-if='host && host.simulator' style='font-size: 14px;'>
            <q-img :src='host.simulator.simulator_avatar_url' style='width: 32px; height: 32px; border-radius: 50%;' />
            <div style='margin-left: 4px; color: white;'>
              {{ host.simulator.simulator }}
            </div>
          </div>
          <div style='font-size: 14px; display: flex;'>
            <div style='margin-left: 8px;  color: white; display: flex; flex-wrap: wrap;'>
              <div v-for='(guest, index) in guests' :key='index' style='color: white; margin-left: 8px;'>
                <q-img v-if='guests.length' :src='guest.simulator.simulator_avatar_url' style='width: 32px; height: 32px; border-radius: 50%;' />
                <div style='margin-left: 4px;'>
                  {{ guest.simulator.simulator }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class='row' style='margin-right: 12px;'>
        <q-space />
        <div style='height: 24px;' class='row'>
          <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoBottomClick' class='cursor-pointer'>
            <q-img :src='gotoBottom' fit='cover' style='width: 24px; height: 24px;' />
          </div>
          <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoTopClick' class='cursor-pointer'>
            <q-img :src='gotoTop' fit='cover' style='width: 24px; height: 24px;' />
          </div>
          <div :style='{borderRight: "1px solid gray", height: "24px", opacity: playScripts ? 1 : 0.4, backgroundColor: "white" }' @click='onPlayScriptsClick' class='cursor-pointer'>
            <q-img :src='dominoMask' fit='cover' style='width: 24px; height: 24px;' />
          </div>
          <div style='height: 24px; opacity: 0.4; background-color: white;' @click='onPlayClick' class='cursor-pointer'>
            <q-img :src='enablePlay ? volumeUp : volumeOff' fit='cover' style='width: 24px; height: 24px;' />
          </div>
        </div>
      </div>
    </div>
    <div style='width: 100%; height: calc(100% - 280px - 4px);' class='bg-grey-2'>
      <div v-if='!displayMessages.length' class='full-width flex justify-center items-center' style='height: calc(100% - 64px); width: 600px; max-width: 100%;'>
        <div
          style='margin-top: 16px; font-size: 20px;'
          class='text-center text-grey-8 flex justify-center items-center'
        >
          <div>
            <q-spinner-facebook class='text-red-4' size='128px' />
            <div>演员正在候场，请稍候...</div>
          </div>
        </div>
      </div>
      <q-scroll-area
        v-else
        style='height: calc(100% - 64px); width: 100%; padding: 0 24px 0 24px;'
        ref='chatBox'
        :bar-style='{ width: "2px" }'
        :thumb-style='{ width: "2px" }'
        @mouseenter='autoScroll = false'
        @mouseleave='autoScroll = true'
        class='q-mt-xs cursor-pointer'
      >
        <div>
          <q-resize-observer @resize='onChatBoxResize' />
          <div>
            <div v-for='(message, index) in displayMessages' :key='index' style='width: 100%; margin: 8px 0;'>
              <MessageCard :message='message' />
            </div>
            <div style='margin: 8px 0;'>
              <MessageCard v-if='lastDisplayMessage' :message='lastDisplayMessage' :key='displayMessages.length + 1' />
            </div>
          </div>
        </div>
      </q-scroll-area>
    </div>
    <div class='flex justify-center items-center'>
      <BottomFixInput
        v-model='inputTopic'
        placeholder='请输入新的相声主题（下一段生效）~'
        @enter='onTopicEnter'
        width='720px'
        max-width='calc(100% - 8px)'
      />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { xiangsheng, model, simulator, setting } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { purify } from 'src/utils'
import { Message } from './Message'
import { xiangshengWorker } from 'src/worker'
import { useRouter } from 'vue-router'
import { QScrollArea } from 'quasar'
import { AudioPlayer } from 'src/player'
import { typing as _typing } from 'src/typing'

import MessageCard from './MessageCard.vue'
import BottomFixInput from '../input/BottomFixInput.vue'

import { gotoBottom, gotoTop, volumeOff, volumeUp, dominoMask } from 'src/assets'

const _uid = computed(() => xiangsheng.Xiangsheng.xiangsheng())
const _xiangsheng = ref(undefined as unknown as dbModel.Xiangsheng)
const backgroundImage = ref('http://8.133.205.39:81/download/images/xiangshengwutai.png')
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const chatBox = ref<QScrollArea>()
const autoScroll = ref(true)
const enablePlay = ref(true)
const playScripts = ref(false)

const hostParticipator = computed(() => participators.value.find((el) => el.role === dbModel.Role.HOST))
const host = computed(() => simulators.value.find((el) => hostParticipator.value && el.participatorId === hostParticipator.value.id))
const guests = computed(() => simulators.value.filter((el) => participators.value.find((_el) => _el.id === el.participatorId && _el.role === dbModel.Role.GUEST)))

const topic = computed(() => xiangsheng.Xiangsheng.topic())
const inputTopic = ref('')

const displayMessages = ref([] as Message[])
const loading = ref(false)
const messageCount = computed(() => displayMessages.value.length + waitMessages.value.size + (lastDisplayMessage.value ? 1 : 0))
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const eXiangsheng = ref(undefined as unknown as entityBridge.EXiangsheng)
const typingMessageIndex = ref(0)
const currentTopic = ref(topic.value)
const generating = ref(false)

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const typingInterval = ref(80)
const typingTicker = ref(-1)

watch(messageCount, () => {
  if (messageCount.value && loading.value) {
    loading.value = false
  }
})

const onChatBoxResize = (size: { height: number }) => {
  if (autoScroll.value) chatBox.value?.setScrollPosition('vertical', size.height, 300)
}

const onPlayScriptsClick = () => {
  playScripts.value = !playScripts.value
  _xiangsheng.value.intent = playScripts.value ? xiangshengWorker.Intent.CLASSIC_SCRIPTS : xiangshengWorker.Intent.GENERATE
}

const onGotoBottomClick = () => {
  autoScroll.value = true
}

const onGotoTopClick = () => {
  autoScroll.value = false
}

const onPlayClick = () => {
  enablePlay.value = !enablePlay.value
}

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, enablePlay.value, typingTicker.value, () => {
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing).then((rc) => {
    if (waitMessages.value.size < 10 && /* waitMessages.value.findIndex((el) => el.last) >= 0 && */ autoScroll.value && !generating.value) {
      generating.value = true
      if (playScripts.value) void eXiangsheng.value.startScripts()
      else void eXiangsheng.value.start()
    }

    if (!rc) return

    if (rc.audioPlayer) audioPlayer.value = rc.audioPlayer
    if (rc.lastDisplayMessage) {
      lastDisplayMessage.value = rc.lastDisplayMessage
    }
    if (rc.typingInterval) {
      typingInterval.value = rc.typingInterval
      typingTicker.value = rc.typingTicker as number
    }
    if (rc.typingMessage) typingMessage.value = rc.typingMessage

    if (typingMessage.value?.last) {
      void AudioPlayer.play('http://8.133.205.39:81/download/mp3/laugh.mp3')
      typingMessageIndex.value = 0
    } else {
      typingMessageIndex.value = rc.typingMessageIndex || typingMessageIndex.value
    }
    if (typingMessage.value?.first) {
      currentTopic.value = typingMessage.value.topic
      displayMessages.value = []
    }
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
}

watch(_uid, () => {
  if (!_uid.value) return
  _xiangsheng.value = dbBridge._Xiangsheng.xiangsheng(_uid.value) as dbModel.Xiangsheng
})

watch(_xiangsheng, async () => {
  participators.value = await dbBridge._Participator.participators(_xiangsheng.value.uid)
})

watch(participators, async () => {
  simulators.value = await entityBridge.EParticipator.simulators(participators.value)
})

const onMessage = async (topic: string, participatorId: number, text: string, audio: string, index: number, first: boolean, last: boolean) => {
  const participator = await dbBridge._Participator.participator(participatorId) as dbModel.Participator
  const timestamp = timestamp2HumanReadable(Date.now())

  generating.value = false

  waitMessages.value.set(`${text}-${index}`, {
    topic,
    message: purify.purifyThink(text),
    participator,
    simulator: await dbBridge._Simulator.simulator(participator.simulatorId) as simulator._Simulator,
    model: await dbBridge._Model.model(participator.modelId) as model._Model,
    timestamp: Date.now(),
    datetime: timestamp,
    audio,
    index,
    first,
    last,
    typing: false
  })
}

const router = useRouter()

const startXiangsheng = async () => {
  displayMessages.value = []
  waitMessages.value = new Map<string, Message>()
  typingMessage.value = undefined as unknown as Message
  lastDisplayMessage.value = undefined as unknown as Message

  if (typingTicker.value >= 0) window.clearInterval(typingTicker.value)
  typingTicker.value = -1

  if (!_uid.value) {
    void router.push({ path: '/xiangsheng/roles' })
    return
  }

  if (audioPlayer.value) {
    audioPlayer.value.context.pause()
    audioPlayer.value.context.currentTime = 0
  }

  _xiangsheng.value = dbBridge._Xiangsheng.xiangsheng(_uid.value) as dbModel.Xiangsheng
  playScripts.value = _xiangsheng.value.intent === xiangshengWorker.Intent.CLASSIC_SCRIPTS

  eXiangsheng.value = new entityBridge.EXiangsheng(_xiangsheng.value, onMessage)
  loading.value = true

  if (playScripts.value) await eXiangsheng.value.startScripts()
  else await eXiangsheng.value.start()

  eXiangsheng.value.generateStageBackground().then((image) => {
    backgroundImage.value = image as string
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed generate background: ${e}`)
  })

  typingTicker.value = window.setInterval(typing, 100)
}

const onTopicEnter = (_topic: string) => {
  xiangsheng.Xiangsheng.setTopic(_topic)
  inputTopic.value = ''
}

watch(_uid, async () => {
  await startXiangsheng()
})

onMounted(async () => {
  await startXiangsheng()
  setting.Setting.setCurrentMenu('xiangsheng')
})

onBeforeUnmount(() => {
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
  }
})

</script>

<style>
</style>
