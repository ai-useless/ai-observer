<template>
  <q-page>
    <div style='height: 100%;' class='full-width flex justify-center items-center'>
      <div v-if='!displayMessages.length' class='full-width flex justify-center items-center' style='height: calc(100vh - 4px); width: min(100%, 600px);'>
        <div
          style='margin-top: 16px; font-size: 20px;'
          class='text-center text-grey-8 flex justify-center items-center'
        >
          <div>
            <q-spinner-facebook class='text-red-4' size='128px' />
            <div>{{ models.length }}个AGI段子手正在创作，请稍候...</div>
          </div>
        </div>
      </div>
      <q-scroll-area
        v-else
        style='height: calc(100vh - 4px); width: min(100%, 600px);'
        ref='chatBox'
        :bar-style='{ width: "2px" }'
        :thumb-style='{ width: "2px" }'
        @mouseenter='autoScroll = false'
        @mouseleave='autoScroll = true'
        class='q-mt-xs cursor-pointer bg-grey-2'
      >
        <div>
          <q-resize-observer @resize='onChatBoxResize' />
          <div v-for='(message, index) in displayMessages' :key='index' :style='{borderBottom : (index < displayMessages.length - 1 && !message.isTitle) ? "1px solid gray" : "", padding: "16px"}'>
            <div v-if='message.isTitle' style='display: flex; padding-bottom: 8px; margin-bottom: 4px; line-height: 32px;'>
              <q-img :src='modelLogo(message.modelId)' style='height: 32px; width: 32px; border-radius: 50%;' />
              <div style='font-weight: 400; font-size: 18px;' class='text-grey-6'>
                {{ modelName(message.modelId) }}
              </div>
            </div>
            <q-img v-if='message.image' mode='widthFix' :src='message.image' style='width: 100%; margin-bottom: 4px;' />
            <div :style='{fontSize: message.isTitle ? "18px" : "12px", fontWeight: message.isTitle ? 600 : 400, textAlign: message.isTitle ? "center" : "left"}'>
              {{ message.text }}
            </div>
          </div>
          <div v-if='lastDisplayMessage' :style='{borderTop: lastDisplayMessage.isTitle ? "1px solid gray" : "", padding: "16px"}'>
            <div v-if='lastDisplayMessage.isTitle' style='display: flex; padding-bottom: 8px; margin-bottom: 4px; line-height: 32px;'>
              <q-img :src='modelLogo(lastDisplayMessage.modelId)' style='height: 32px; width: 32px; border-radius: 50%;' />
              <div style='font-weight: 400; font-size: 18px;' class='text-grey-6'>
                {{ modelName(lastDisplayMessage.modelId) }}
              </div>
            </div>
            <q-img v-if='lastDisplayMessage.image' mode='widthFix' :src='lastDisplayMessage.image' style='width: 100%; margin-bottom: 4px;' />
            <div :style='{fontSize: lastDisplayMessage.isTitle ? "18px" : "12px", fontWeight: lastDisplayMessage.isTitle ? 600 : 400, textAlign: lastDisplayMessage.isTitle ? "center" : "left"}'>
              {{ lastDisplayMessage.text }}
            </div>
          </div>
        </div>
      </q-scroll-area>
    </div>
    <div class='flex justify-center items-center'>
      <BottomFixArea>
        <template #default>
          <div style='display: flex; justify-content: center; align-items: center; width: 100%; height: 24px;'>
            <div style='display: flex; align-items: center; border: 1px solid gray; border-radius: 8px; height: 24px; background-color: rgba(160, 160, 160, 0.5);'>
              <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoBottomClick' class='cursor-pointer'>
                <q-img :src='gotoBottom' mode='widthFix' style='width: 24px; height: 24px;' />
              </div>
              <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoTopClick' class='cursor-pointer'>
                <q-img :src='gotoTop' mode='widthFix' style='width: 24px; height: 24px;' />
              </div>
              <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onPlayClick' class='cursor-pointer'>
                <q-img :src='enablePlay ? volumeUp : volumeOff' mode='widthFix' style='width: 24px; height: 24px;' />
              </div>
              <div style='height: 24px; opacity: 0.4; background-color: white;' @click='onMoreClick' class='cursor-pointer'>
                <q-img :src='threeDotsVertical' mode='widthFix' style='width: 24px; height: 24px;' />
              </div>
            </div>
          </div>
        </template>
      </BottomFixArea>
    </div>
  </q-page>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { model, setting, simulator } from 'src/localstores'
import { purify } from 'src/utils'
import { computed, onMounted, ref, onBeforeUnmount } from 'vue'
import { QScrollArea } from 'quasar'

import BottomFixArea from '../fixed/BottomFixArea.vue'

import { gotoBottom, gotoTop, volumeOff, volumeUp, threeDotsVertical } from 'src/assets'

interface Message {
  text: string
  isTitle: boolean
  audio: string
  modelId: number
  index: number
  image?: string
}

const models = computed(() => model.Model.models())

const displayMessages = ref([] as Message[])
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const lastModelId = ref(-1 as unknown as number)

const chatBox = ref<QScrollArea>()
const generating = ref(true)
const images = ref(new Map<number, string>())

const modelLogo = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.model_logo_url : ''
}

const modelName = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.name : ''
}

const onChatBoxResize = (size: { height: number }) => {
  if (autoScroll.value) chatBox.value?.setScrollPosition('vertical', size.height, 300)
}

const generate = async () => {
  generating.value = true

  for (const model of models.value) {
    const simulator = await dbBridge._Simulator.randomPeek()
    const messages = [...displayMessages.value, ...waitMessages.value.values()]
    await entityBridge.Duanzi.generate(messages.map((el) => el.text), model.id, simulator.id, (text: string, isTitle: boolean, index: number, audio?: string) => {
      generating.value = false

      waitMessages.value.set(`${text}-${index}`, {
        modelId: model.id,
        text: purify.purifyThink(text),
        isTitle,
        audio: audio || '',
        index,
        image: images.value.get(index)
      })

      images.value.delete(index)
    }, (index: number, image: string) => {
      const messages = [...displayMessages.value, ...(lastDisplayMessage.value ? [lastDisplayMessage.value] : []), ...(typingMessage.value ? [typingMessage.value] : []), ...waitMessages.value.values()]
      const message = messages.find((el) => el.index === index)
      if (message) message.image = image
      else images.value.set(index, image)
    }, true)
  }
}

const onMoreClick = async () => {
  if (generating.value) return
  await generate()
}

onMounted(() => {
  setting.Setting.setCurrentMenu('duanzi')

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      void generate()
    })
  })

  typingTicker.value = window.setInterval(typing, 100)
})

interface AudioPlayer {
  context: HTMLAudioElement
  playing: boolean
  duration: number
  durationTicker: number
}

onBeforeUnmount(() => {
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (audioPlayer.value) {
    audioPlayer.value.context.pause()
    audioPlayer.value.context.currentTime = 0
    audioPlayer.value = undefined as unknown as AudioPlayer
  }
})

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const typingInterval = ref(80)
const typingTicker = ref(-1)
const autoScroll = ref(true)
const enablePlay = ref(true)

const onGotoBottomClick = () => {
  autoScroll.value = true
}

const onGotoTopClick = () => {
  autoScroll.value = false
}

const onPlayClick = () => {
  enablePlay.value = !enablePlay.value
}

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.text && typingMessage.value.text.length) {
    const interval = Math.ceil(duration * 1000 / purify.purifyText(typingMessage.value.text).length)
    typingInterval.value = interval
  }
}

const typing = () => {
  if (!typingMessage.value && !waitMessages.value.size) return

  // If we have a message in typing, finish it
  if (typingMessage.value && lastDisplayMessage.value && lastDisplayMessage.value.text.length < typingMessage.value.text.length) {
    if (lastDisplayMessage.value.text.length > 0 && audioPlayer.value && !audioPlayer.value.playing) {
      lastDisplayMessage.value.text = typingMessage.value.text
      return
    }
    const matches = typingMessage.value.text.slice(lastDisplayMessage.value.text.length).match(/^<[^>]+>/) || []
    const appendLen = matches[0] ? matches[0].length + 1 : 1
    lastDisplayMessage.value.text = typingMessage.value.text.slice(0, lastDisplayMessage.value.text.length + appendLen)
    return
  }

  if (lastDisplayMessage.value) {
    displayMessages.value.push(lastDisplayMessage.value)
    lastDisplayMessage.value = undefined as unknown as Message
  }

  if (!waitMessages.value.size) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && audioPlayer.value.playing) return

  let key = undefined as unknown as string
  for (const [k, v] of waitMessages.value) {
    if (v.index === typingMessageIndex.value) {
      key = k
      break
    }
  }
  if (!key) return

  typingMessage.value = waitMessages.value.get(key) as Message
  waitMessages.value.delete(key)
  typingMessageIndex.value += 1

  lastModelId.value = typingMessage.value.modelId

  if (waitMessages.value.size <= 3 && displayMessages.value.length > 3) void generate()

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
    text: ''
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

</script>
