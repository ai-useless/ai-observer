<template>
  <div style='max-width: min(960px, 100%); min-width: 960px; height: calc(100vh - 80px); overflow: scroll;' class='hide-scrollbar'>
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
    <div style='width: 100%; height: calc(100% - 280px - 4px);'>
      <q-scroll-area
        style='height: 100%; width: 100%; padding: 0 24px;'
        ref='chatBox'
        :bar-style='{ width: "2px" }'
        :thumb-style='{ width: "2px" }'
        @mouseenter='autoScroll = false'
        @mouseleave='autoScroll = true'
        class='q-mt-xs cursor-pointer bg-grey-2'
      >
        <div style='margin-top: 16px;'>
          <div v-for='(message, index) in displayMessages' :key='index' style='width: 100%'>
            <MessageCard :message='message' />
          </div>
          <MessageCard v-if='lastDisplayMessage' :message='lastDisplayMessage' :key='displayMessages.length + 1' />
        </div>
      </q-scroll-area>
    </div>
    <div>
      <BottomFixInput v-model='inputTopic' placeholder='请输入新的相声主题~' @enter='onTopicEnter' />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { xiangsheng, model, simulator, setting } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { purify } from 'src/utils'
import { Message } from './Message'
import { xiangshengWorker } from 'src/worker'
import { useRouter } from 'vue-router'

import MessageCard from './MessageCard.vue'
import BottomFixInput from '../input/BottomFixInput.vue'

import { gotoBottom, gotoTop, volumeOff, volumeUp, dominoMask } from 'src/assets'

const _uid = computed(() => xiangsheng.Xiangsheng.xiangsheng())
const _xiangsheng = ref(undefined as unknown as dbModel.Xiangsheng)
const backgroundImage = ref('http://106.15.6.50:81/download/images/xiangshengwutai.png')
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const scrollTop = ref(999999)
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
const messageCount = computed(() => displayMessages.value.length + waitMessages.value.length + (lastDisplayMessage.value ? 1 : 0))
const waitMessages = ref([] as Message[])
const lastDisplayMessage = ref(undefined as unknown as Message)
const lastMessageText = computed(() => lastDisplayMessage.value ? lastDisplayMessage.value.message : undefined)
const typingMessage = ref(undefined as unknown as Message)
const eXiangsheng = ref(undefined as unknown as entityBridge.EXiangsheng)
const typingMessageIndex = ref(0)
const currentTopic = ref(topic.value)

interface AudioPlayer {
  context: HTMLAudioElement
  playing: boolean
  duration: number
  durationTicker: number
}

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const typingInterval = ref(80)
const typingTicker = ref(-1)

watch(messageCount, () => {
  if (messageCount.value && loading.value) {
    loading.value = false
  }
})

watch(lastMessageText, async () => {
  if (!autoScroll.value) return
  await nextTick()
  scrollTop.value += 1
})

const onPlayScriptsClick = () => {
  playScripts.value = !playScripts.value
  _xiangsheng.value.intent = playScripts.value ? xiangshengWorker.Intent.CLASSIC_SCRIPTS : xiangshengWorker.Intent.GENERATE
}

const onGotoBottomClick = () => {
  autoScroll.value = true
  scrollTop.value = 999999
}

const onGotoTopClick = () => {
  autoScroll.value = false
  scrollTop.value = 0
}

const onPlayClick = () => {
  enablePlay.value = !enablePlay.value
}

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.message && typingMessage.value.message.length) {
    const interval = Math.ceil(duration * 1000 / purify.purifyText(typingMessage.value.message).length)
    typingInterval.value = interval
  }
}

const typing = () => {
  if (!typingMessage.value && !waitMessages.value.length) return

  // If we have a message in typing, finish it
  if (typingMessage.value && lastDisplayMessage.value && lastDisplayMessage.value.message.length < typingMessage.value.message.length) {
    if (lastDisplayMessage.value.message.length > 0 && audioPlayer.value && !audioPlayer.value.playing) {
      lastDisplayMessage.value.message = typingMessage.value.message
      return
    }
    const matches = typingMessage.value.message.slice(lastDisplayMessage.value.message.length).match(/^<[^>]+>/) || []
    const appendLen = matches[0] ? matches[0].length + 1 : 1
    lastDisplayMessage.value.message = typingMessage.value.message.slice(0, lastDisplayMessage.value.message.length + appendLen)
    return
  }

  if (lastDisplayMessage.value) {
    lastDisplayMessage.value.typing = false
    displayMessages.value.push(lastDisplayMessage.value)
    lastDisplayMessage.value = undefined as unknown as Message
  }
  displayMessages.value.forEach((el) => {
    el.datetime = timestamp2HumanReadable(el.timestamp)
  })

  if (!waitMessages.value.length) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && audioPlayer.value.playing) return

  const index = waitMessages.value.findIndex((el) => el.index === typingMessageIndex.value && (!currentTopic.value || el.topic === currentTopic.value || el.first))
  if (index < 0) return
  typingMessage.value = waitMessages.value[index]

  if (typingMessageIndex.value === 0 && typingMessage.value.first) currentTopic.value = typingMessage.value.topic

  waitMessages.value = [...waitMessages.value.slice(0, index), ...waitMessages.value.slice(index + 1, waitMessages.value.length)]

  if (waitMessages.value.length < 10 && /* waitMessages.value.findIndex((el) => el.last) >= 0 && */ autoScroll.value) {
    if (playScripts.value) void eXiangsheng.value.startScripts()
    else void eXiangsheng.value.start()
  }

  typingMessageIndex.value += 1
  if (typingMessage.value.last) typingMessageIndex.value = 0
  if (typingMessage.value.first) displayMessages.value = []

  if (typingMessage.value.audio && typingMessage.value.audio.length && enablePlay.value) {
    window.clearInterval(typingTicker.value)
    playAudio(typingMessage.value.audio).then((player: AudioPlayer | undefined) => {
      if (player && player.duration > 0) {
        calculateTypingInterval(player.duration)
        audioPlayer.value = player
        typingTicker.value = window.setInterval(typing, typingInterval.value)
      }
    }).catch((e) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Failed play audio: ${e}`)
      typingTicker.value = window.setInterval(typing, typingInterval.value)
    })
  }

  lastDisplayMessage.value = {
    ...typingMessage.value,
    message: '',
    typing: true
  }
}

const playAudio = (audioUrl: string): Promise<AudioPlayer | undefined> => {
  const context = new Audio(audioUrl)
  context.src = audioUrl

  const player = {
    context: context,
    playing: true,
    duration: context.duration
  } as AudioPlayer

  return new Promise((resolve, reject) => {
    context.onerror = (e) => {
      player.playing = false
      if (player.durationTicker >= 0) {
        window.clearInterval(player.durationTicker)
        player.durationTicker = -1
      }
      reject(`Failed play audio: ${JSON.stringify(e)}`)
    }
    context.oncanplay = async () => {
      await context.play()

      player.durationTicker = window.setInterval(() => {
        if (context.duration) {
          window.clearInterval(player.durationTicker)
          player.durationTicker = -1
          player.duration = context.duration
          resolve(player)
        }
      }, 100)
    }
    context.onended = () => {
      player.playing = false
      if (player.durationTicker >= 0) {
        window.clearInterval(player.durationTicker)
        player.durationTicker = -1
      }
    }
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

  waitMessages.value.push({
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

  waitMessages.value = waitMessages.value.map((el) => {
    const timestamp = timestamp2HumanReadable(el.timestamp)
    return { ...el, datetime: timestamp }
  })
}

const router = useRouter()

const startXiangsheng = async () => {
  displayMessages.value = []
  waitMessages.value = []
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

</script>

<style>
</style>
