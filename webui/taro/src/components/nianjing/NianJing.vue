<template>
  <View>
    <View :style='{ height: scriptHeight + "px", width: "100vw" }'>
      <View style='font-size: 18px; font-weight: 600; border-bottom: 1px solid lightgray; margin: 8px 16px; color: gray; text-align: center; height: 32px;'>{{ prompt }}</View>
      <Image
        src='http://8.133.205.39:81/download/images/qiaomuyu.gif'
        mode='widthFix'
        style='width: 100vw; height: 400px;'
      />
      <View v-if='generating' :style='{ height: scrollHeight + "px", padding: "0 16px", display: "flex", justifyContent: "center", alignItems: "center" }'>
        <Button class='plain-btn' style='font-size: 14px; color: gray;' plain :loading='true'>师傅正在准备，请稍后...</Button>
      </View>
      <scroll-view
        v-else
        scrollY={true}
        :scroll-with-animation='true'
        :style='{ height: scrollHeight + "px", padding: "0 16px 8px 16px", width: "calc(100% - 32px)" }'
        :scroll-top='scrollTop'
        showScrollbar={false}
        enhanced={true}
        showsVerticalScrollIndicator={false}
      >
        <View v-for='(message, index) in displayMessages' :key='index' :style='{borderTop: index > 0 ? "1px solid lightgray" : "", padding: "8px 0", textAlign: "center", marginBottom: "4px"}'>
          <View style='font-size: 14px; color: gray'>{{ message.message }}</View>
        </View>
        <View v-if='lastDisplayMessage' style='padding: 8px 0; text-align: center; border-top: 1px solid lightgray; margin-bottom: 4px;'>
          <View style='font-size: 14px; color: gray;'>{{ lastDisplayMessage.message }}</View>
        </View>
      </scroll-view>
    </View>
    <View style='display: flex; padding: 0 16px;'>
      <ComplexInput v-model:prompt='prompt' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='听一段经文，让心静下来~'>
        <template #actions>
          <View style='display: flex;'>
            <View style='height: 24px; width: 24px; padding: 3px 0; margin-left: 4px; margin-right: -4px;' @click='onGenerateClick'>
              <Image :src='send' style='width: 18px; height: 18px;' />
            </View>
            <View style='height: 24px; background-color: white;' @click='onOpenSelectSimulatorClick'>
              <Image :src='personAvatar' mode='widthFix' style='width: 24px; height: 24px;' />
            </View>
          </View>
        </template>
      </ComplexInput>
    </View>
  </View>
  <AtModal :is-opened='selectingSimulator' @close='onSimulatorSelectorClose'>
    <AtModalHeader>选择模拟器</AtModalHeader>
    <AtModalContent>
      <View>
        <View v-for='(_simulator, index) in simulators' :key='index' style='border-bottom: 1px solid gray;' @click='onSelectSimulatorClick(_simulator)'>
          <SimulatorCard :simulator='_simulator' />
        </View>
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelSelectSimulatorClick'>取消</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import { View, Image, Button } from '@tarojs/components'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import { dbBridge, entityBridge } from 'src/bridge'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import { model, simulator } from 'src/localstores'
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'

import ComplexInput from '../input/ComplexInput.vue'
import SimulatorCard from '../simulator/SimulatorCard.vue'

import { send, personAvatar } from 'src/assets'

const prompt = ref('般若波罗密心经')

const audioInput = ref(false)
const audioError = ref('')

const inputHeight = ref(0)
const scriptHeight = ref(0)
const scrollHeight = ref(0)
const scrollTop = ref(999999)

interface Message extends MessageBase {
  first: boolean
  last: boolean
}

const displayMessages = ref([] as Message[])
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const typingTicker = ref(-1)
const typingInterval = ref(40)

const messageCount = computed(() => waitMessages.value.size)

const generating = ref(false)

const speaker = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const simulators = computed(() => simulator.Simulator.allSimulators())
const selectingSimulator = ref(false)

watch(scriptHeight, () => {
  scrollHeight.value = scriptHeight.value - 400 - 32
})

watch(messageCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

const generate = () => {
  generating.value = true

  displayMessages.value = []
  waitMessages.value = new Map<string, Message>()
  lastDisplayMessage.value = undefined as unknown as Message
  typingMessage.value = undefined as unknown as Message

  if (audioPlayer.value && audioPlayer.value.context) audioPlayer.value.context.stop()
  audioPlayer.value = undefined as unknown as AudioPlayer

  entityBridge.ENianJing.request(prompt.value, speaker.value.id, _model.value.id, (message: string, index: number, first: boolean, last: boolean, audio?: string) => {
    generating.value = false
    waitMessages.value.set(`${message}-${index}`, {
      message,
      audio: audio as unknown as string,
      index,
      first,
      last,
      timestamp: Date.now()
    })
  })
}

watch(prompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  generate()
  prompt.value = ''
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onGenerateClick = () => {
  generate()
}

watch(inputHeight, () => {
  if (Taro.getWindowInfo()) {
    scriptHeight.value = Taro.getWindowInfo().windowHeight - 32 - inputHeight.value
  }
})

const onOpenSelectSimulatorClick = () => {
  selectingSimulator.value = true
}

const onSelectSimulatorClick = (_simulator: simulator._Simulator) => {
  speaker.value = _simulator
  selectingSimulator.value = false
}

const onSimulatorSelectorClose = () => {
  selectingSimulator.value = false
}

const onCancelSelectSimulatorClick = () => {
  selectingSimulator.value = false
}

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI妙音坊'
  })
  if (Taro.getWindowInfo()) {
    scriptHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
  model.Model.getModels(() => {
    _model.value = dbBridge._Model.model(dbBridge._Model.topicModelId()) as model._Model
    simulator.Simulator.getSimulators(undefined, () => {
      speaker.value = dbBridge._Simulator.randomPeek()
    })
  })
})

useDidShow(async () => {
  typingTicker.value = window.setInterval(typing, typingInterval.value)
  bgPlayer.value = await playAudio('http://8.133.205.39:81/download/mp3/qiaomuyu.mp3', true) as AudioPlayer
  generate()
})

useDidHide(() => {
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (bgPlayer.value && bgPlayer.value.context) {
    bgPlayer.value.stop()
    bgPlayer.value = undefined as unknown as AudioPlayer
  }
})

const audioPlayer = ref(undefined as unknown as AudioPlayer)
const bgPlayer = ref(undefined as unknown as AudioPlayer)

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, true, typingTicker.value, () => {
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing).then((rc) => {
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
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
}

const playAudio = (audioUrl: string, loop?: boolean): Promise<AudioPlayer | undefined> => {
  const context = Taro.createInnerAudioContext()
  context.src = audioUrl

  const player = {
    context: context,
    playing: true,
    duration: context.duration
  } as AudioPlayer

  return new Promise((resolve, reject) => {
    context.onError((e) => {
      player.playing = false
      if (player.durationTicker >= 0) {
        window.clearInterval(player.durationTicker)
        player.durationTicker = -1
      }
      reject(`Failed play audio: ${JSON.stringify(e)}`)
    })
    context.onCanplay(() => {
      context.play()

      player.durationTicker = window.setInterval(() => {
        if (context.duration) {
          window.clearInterval(player.durationTicker)
          player.durationTicker = -1
          player.duration = context.duration
          resolve(player)
          return
        }
      }, 100)
    })
    context.onEnded(() => {
      player.playing = false
      if (player.durationTicker >= 0) {
        window.clearInterval(player.durationTicker)
        player.durationTicker = -1
      }
      if (loop) {
        context.seek(0)
        context.stop()
        context.play()
      }
    })
  })
}

</script>

<style lang='sass'>
.plain-btn
  border: none !important
  background-color: transparent
  box-shadow: none !important
  padding: 0 !important

.plain-btn::after
  border: none !important
  content: none !important
</style>
