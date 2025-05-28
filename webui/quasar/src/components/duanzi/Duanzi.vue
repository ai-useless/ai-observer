<template>
  <q-page>
    <div :style='{height: `${contentHeight}px`, width: "100%"}' class='flex justify-center items-center'>
      <div v-if='!displayMessages.length && !lastDisplayMessage' class='flex justify-center items-center bg-grey-2' style='height: calc(100% - 4px); width: 600px; max-width: 100%;'>
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
      <div v-else style='height: calc(100% - 4px); width: 600px; max-width: 100%;' class='bg-grey-2'>
        <q-scroll-area
          style='height: calc(100% - 4px - 28px); width: 600px; max-width: 100%; overflow-x: hidden;'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          @mouseenter='autoScroll = false'
          @mouseleave='autoScroll = true'
          class='q-mt-xs cursor-pointer'
        >
          <div>
            <q-resize-observer @resize='onChatBoxResize' />
            <div v-for='(message, index) in displayMessages' :key='index' :style='{borderBottom : (index < displayMessages.length - 1 && !message.isTitle) ? "1px solid gray" : ""}'>
              <div v-if='message.isTitle' style='display: flex; line-height: 32px; padding: 16px;'>
                <q-img :src='modelLogo(message.modelId)' style='height: 32px; width: 32px; border-radius: 50%;' />
                <div style='font-weight: 400; font-size: 18px; line-height: 1.2em;' class='text-grey-6 q-ml-sm flex items-center'>
                  {{ modelName(message.modelId) }}
                </div>
              </div>
              <q-img v-if='message.image' :src='message.image' style='width: 100%; margin-bottom: 4px;' />
              <div :style='{fontSize: message.isTitle ? "18px" : "16px", fontWeight: message.isTitle ? 600 : 400, textAlign: message.isTitle ? "center" : "left", padding: "16px", lineHeight: "24px"}'>
                {{ message.message }}
              </div>
            </div>
            <div v-if='lastDisplayMessage' :style='{borderTop: lastDisplayMessage.isTitle ? "1px solid gray" : ""}'>
              <div v-if='lastDisplayMessage.isTitle' style='display: flex; line-height: 32px; padding: 16px;'>
                <q-img :src='modelLogo(lastDisplayMessage.modelId)' style='height: 32px; width: 32px; border-radius: 50%;' />
                <div style='font-weight: 400; font-size: 18px;' class='text-grey-6'>
                  {{ modelName(lastDisplayMessage.modelId) }}
                </div>
              </div>
              <q-img v-if='lastDisplayMessage.image' :src='lastDisplayMessage.image' style='width: 100%; margin-bottom: 4px;' />
              <div :style='{fontSize: lastDisplayMessage.isTitle ? "18px" : "16px", fontWeight: lastDisplayMessage.isTitle ? 600 : 400, textAlign: lastDisplayMessage.isTitle ? "center" : "left", padding: "16px", lineHeight: "24px"}'>
                {{ lastDisplayMessage.message }}
              </div>
            </div>
          </div>
        </q-scroll-area>
      </div>
    </div>
    <div class='flex justify-center items-center'>
      <BottomFixArea background-color='transparent' max-width='96px'>
        <template #default>
          <div style='display: flex; justify-content: center; align-items: center; width: 100%; height: 24px;'>
            <div style='display: flex; align-items: center; border: 1px solid gray; border-radius: 8px; height: 24px; background-color: rgba(160, 160, 160, 0.5);'>
              <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoBottomClick' class='cursor-pointer'>
                <q-img :src='gotoBottom' style='width: 24px; height: 24px;' />
              </div>
              <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoTopClick' class='cursor-pointer'>
                <q-img :src='gotoTop' style='width: 24px; height: 24px;' />
              </div>
              <div style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onPlayClick' class='cursor-pointer'>
                <q-img :src='enablePlay ? volumeUp : volumeOff' style='width: 24px; height: 24px;' />
              </div>
              <div :style='{ borderRight: "1px solid gray", height: "24px", opacity: enableLaugh ? 1 : 0.4, backgroundColor: "white" }' @click='onLaughClick' class='cursor-pointer'>
                <q-img :src='sentimentExcited' style='width: 24px; height: 24px;' />
              </div>
              <div style='height: 24px; opacity: 0.4; background-color: white;' @click='onMoreClick' class='cursor-pointer'>
                <q-img :src='threeDotsVertical' style='width: 24px; height: 24px;' />
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
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'

import BottomFixArea from '../fixed/BottomFixArea.vue'

import { gotoBottom, gotoTop, volumeOff, volumeUp, threeDotsVertical, sentimentExcited } from 'src/assets'

interface Message extends MessageBase {
  isTitle: boolean
  modelId: number
  image?: string
}

const models = computed(() => model.Model.models())

const contentHeight = computed(() => setting.Setting.contentHeight())

const displayMessages = ref([] as Message[])
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const lastModelId = ref(-1 as unknown as number)

const chatBox = ref<QScrollArea>()
const generating = ref(false)
const images = ref(new Map<number, string>())

const eDuanzi = ref(undefined as unknown as entityBridge.Duanzi)

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
  if (generating.value) return

  generating.value = true

  for (const model of models.value) {
    const simulator = await dbBridge._Simulator.randomPeek()
    const messages = [...displayMessages.value, ...waitMessages.value.values()]
    await eDuanzi.value?.generate(messages.map((el) => el.message), model.id, simulator.id, (text: string, isTitle: boolean, index: number, audio?: string) => {
      generating.value = false

      waitMessages.value.set(`${text}-${index}`, {
        modelId: model.id,
        message: purify.purifyThink(text),
        isTitle,
        audio: audio || '',
        index,
        image: images.value.get(index),
        timestamp: Date.now()
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
  eDuanzi.value = new entityBridge.Duanzi()

  setting.Setting.setCurrentMenu('duanzi')

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      void generate()
    })
  })

  typingTicker.value = window.setInterval(typing, 100)
})

onBeforeUnmount(() => {
  eDuanzi.value.stop()
  eDuanzi.value = undefined as unknown as entityBridge.Duanzi

  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (audioPlayer.value) {
    audioPlayer.value.stop()
  }
})

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const typingInterval = ref(80)
const typingTicker = ref(-1)
const autoScroll = ref(true)
const enablePlay = ref(false)
const enableLaugh = ref(false)

const onGotoBottomClick = () => {
  autoScroll.value = true
}

const onGotoTopClick = () => {
  autoScroll.value = false
}

const onPlayClick = () => {
  enablePlay.value = !enablePlay.value
}

const onLaughClick = () => {
  enableLaugh.value = !enableLaugh.value
}

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, enablePlay.value, typingTicker.value, () => {
    if (enableLaugh.value && lastDisplayMessage.value?.isTitle === false)
      void AudioPlayer.play('http://api.meipu-agi.cn/downloads/laugh.mp3')
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing, undefined, 20).then((rc) => {
    if (waitMessages.value.size <= 3 && displayMessages.value.length > 3) {
      void generate()
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

    typingMessageIndex.value = rc.typingMessageIndex || typingMessageIndex.value

    if (typingMessage.value) lastModelId.value = typingMessage.value.modelId
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
}

</script>
