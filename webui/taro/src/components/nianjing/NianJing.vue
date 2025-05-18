<template>
  <View>
    <scroll-view
      scrollY={true}
      :scroll-with-animation='true'
      :style='{ height: scriptHeight + "px" }'
      :scroll-top='scrollTop'
      showScrollbar={false}
      enhanced={true}
      showsVerticalScrollIndicator={false}
    >
      <View v-for='(message, index) in messages' :key='index' :style='{borderBottom: index < messages.length - 1 ? "1px solid lightgray" : "", padding: "8px 0"}'>
        <View style='font-size: 14px;'>{{ message.message }}</View>
      </View>
    </scroll-view>
    <View style='display: flex;'>
      <ComplexInput v-model:prompt='prompt' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='听一段经文，让心静下来~'>
        <template #actions>
          <View style='display: flex;'>
            <View style='height: 24px; width: 24px; padding: 3px 0; margin-left: 4px; margin-right: -4px;' @click='onGenerateClick'>
              <Image :src='send' style='width: 18px; height: 18px;' />
            </View>
            <View style='height: 24px; background-color: white;' @click='onSelectSimulatorClick'>
                <Image :src='personAvatar' mode='widthFix' style='width: 24px; height: 24px;' />
            </View>
          </View>
        </template>
      </ComplexInput>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image } from '@tarojs/components'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { dbBridge, entityBridge } from 'src/bridge'
import Taro from '@tarojs/taro'
import { model, simulator } from 'src/localstores'
import { purify } from 'src/utils'

import ComplexInput from '../input/ComplexInput.vue'

import { send, personAvatar } from 'src/assets'

const prompt = ref('般若波罗密心经')

const audioInput = ref(false)
const audioError = ref('')

const inputHeight = ref(0)
const scriptHeight = ref(0)
const scrollTop = ref(999999)

interface Message {
  message: string
  audio?: string
  index: number
}

const messages = ref([] as Message[])
const messageCount = computed(() => messages.value.length)

const generating = ref(false)

const speaker = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

watch(messageCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

watch(generating, () => {
  if (generating.value) {
    Taro.showLoading({
      title: '正在准备...'
    })
  } else {
    Taro.hideLoading()
  }
})

const generate = () => {
  generating.value = true

  entityBridge.ENianJing.request(prompt.value, speaker.value.id, _model.value.id, (message: string, index: number, audio?: string) => {
    generating.value = false
    messages.value.push({
      message,
      audio,
      index
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

const onSelectSimulatorClick = () => {

}

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.message && typingMessage.value.message.length) {
    const interval = Math.ceil(duration * 1000 / purify.purifyText(typingMessage.value.message).length)
    typingInterval.value = interval
  }
}

const displayMessages = ref([] as Message[])
const waitMessages = ref([] as Message[])
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const typingTicker = ref(-1)
const typingInterval = ref(40)

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

class AudioPlayer {
  context: Taro.InnerAudioContext
  playing: boolean
  duration: number
  durationTicker: number
}

const audioPlayer = ref(undefined as unknown as AudioPlayer)

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
    displayMessages.value.push(lastDisplayMessage.value)
    lastDisplayMessage.value = undefined as unknown as Message
  }

  if (!waitMessages.value.length) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && audioPlayer.value.playing) return

  const index = waitMessages.value.findIndex((el) => el.index === typingMessageIndex.value)
  if (index < 0) return

  typingMessage.value = waitMessages.value[index]
  waitMessages.value = [...waitMessages.value.slice(0, index), ...waitMessages.value.slice(index + 1)]
  typingMessageIndex.value += 1

  if (waitMessages.value.length <= 3 && displayMessages.value.length > 3) void generate()

  if (typingMessage.value.audio && typingMessage.value.audio.length) {
    window.clearInterval(typingTicker.value)
    playAudio(typingMessage.value.audio).then((player: AudioPlayer) => {
      if (player && player.duration > 0) {
        calculateTypingInterval(player.duration)
        audioPlayer.value = player
        typingTicker.value = window.setInterval(typing, typingInterval.value)
      }
    }).catch((e) => {
      console.log(`Failed play audio: ${e}`)
      typingTicker.value = window.setInterval(typing, typingInterval.value)
    })
  }

  lastDisplayMessage.value = {
    ...typingMessage.value,
    message: ''
  }
}

const playAudio = (audioUrl: string): Promise<AudioPlayer | undefined> => {
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
    })
  })
}

</script>
