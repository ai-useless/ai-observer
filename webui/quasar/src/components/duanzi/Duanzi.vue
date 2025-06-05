<template>
  <q-page>
    <div :style='{height: `${contentHeight}px`, width: "100%"}' class='flex justify-center items-center'>
      <div v-if='!displayMessages.length && !lastDisplayMessage' class='flex justify-center items-center' style='height: calc(100% - 4px); width: 600px; max-width: 100%;'>
        <div
          style='margin-top: 16px; font-size: 20px;'
          class='text-center text-grey-8 flex justify-center items-center'
        >
          <div>
            <q-spinner-facebook class='text-red-4' size='64px' />
            <div style='font-size: 14px'>{{ models.length }}个AGI段子手正在创作，请稍候...</div>
          </div>
        </div>
      </div>
      <div v-else style='height: calc(100% - 4px); width: 600px; max-width: 100%;'>
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
            <div v-for='(message, index) in displayMessages' :key='index' :style='{borderBottom : index < displayMessages.length - 1 ? "1px solid gray" : ""}'>
              <MessageCard :message='message' />
            </div>
            <div v-if='lastDisplayMessage' :style='{borderTop: displayMessages.length > 0 ? "1px solid gray" : ""}'>
              <MessageCard :message='lastDisplayMessage' />
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
import MessageCard from './MessageCard.vue'

import { gotoBottom, gotoTop, volumeOff, volumeUp, threeDotsVertical, sentimentExcited } from 'src/assets'

interface Message extends MessageBase {
  title: string
  modelId: number
  messageUid: string
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
const images = ref(new Map<string, string>())

const eDuanzi = ref(undefined as unknown as entityBridge.Duanzi)
const nextDuanziIndex = ref(0)

const onChatBoxResize = (size: { height: number }) => {
  if (autoScroll.value) chatBox.value?.setScrollPosition('vertical', size.height, 300)
}

const generate = async () => {
  if (generating.value) return

  generating.value = true

  for (const model of models.value) {
    const simulator = await dbBridge._Simulator.randomPeek()
    const messages = [...displayMessages.value, ...waitMessages.value.values()]
    await eDuanzi.value?.generate(messages.map((el) => el.message), model.id, simulator.id, (title: string, content: string, audio?: string, messageUid?: string) => {
      generating.value = false

      const contentIndex = nextDuanziIndex.value++

      waitMessages.value.set(`${content}-${contentIndex}`, {
        title,
        modelId: model.id,
        message: purify.purifyThink(content),
        audio: audio as string,
        index: contentIndex,
        image: images.value.get(messageUid),
        timestamp: Date.now(),
        messageUid
      })

      images.value.delete(messageUid)
    }, (messageUid: string, image: string) => {
      const messages = [...displayMessages.value, ...(lastDisplayMessage.value ? [lastDisplayMessage.value] : []), ...(typingMessage.value ? [typingMessage.value] : []), ...waitMessages.value.values()]
      const message = messages.find((el) => el.messageUid === messageUid)
      if (message) message.image = image
      else images.value.set(messageUid, image)
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
  if (eDuanzi.value) {
    eDuanzi.value.stop()
    eDuanzi.value = undefined as unknown as entityBridge.Duanzi
  }

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
    if (enableLaugh.value)
      void AudioPlayer.play('https://api.meipu-agi.cn/downloads/laugh.mp3')
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
