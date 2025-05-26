<template>
  <q-page>
    <div style='width: 100%; height: 100vh;' class='flex justify-center items-center'>
      <div style='height: 100vh; width: 600px; max-width: 100%;' class='bg-grey-2'>
        <div>
          <div style='font-size: 18px; font-weight: 600; margin: 8px 16px; text-align: center; height: 32px; line-height: 32px;'>
            <q-avatar size='32px'>
              <q-img :src='speaker?.simulator_avatar_url' />
            </q-avatar>
            <span class='q-ml-sm'>{{ speaker?.simulator }}</span>
            <span style='font-size: 12px' class='text-grey-6 q-mx-xs'>
              念诵
            </span>
            <span>
              {{ prompt }}
            </span>
            <q-btn
              flat
              dense
              color='light-blue'
              class='q-ml-xs'
              @click='selectingSpeaker = !selectingSpeaker'
            >
              换人
            </q-btn>
          </div>
          <q-img
            src='http://8.133.205.39:81/download/images/qiaomuyu.gif'
            style='width: 100%;'
          />
          <q-resize-observer @resize='onHeadBoxResize' />
        </div>
        <div v-if='generating' class='flex justify-center items-center' style='height: 128px; width: 100%'>
          <div class='text-center'>
            <q-spinner-facebook class='text-red-4' size='64px' />
            <div>师傅正在准备，请稍后...</div>
          </div>
        </div>
        <q-scroll-area
          v-else
          :style='{ height: `calc(100% - ${headHeight}px - 68px)`, width: "100%", padding: "8px 16px;" }'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div>
            <q-resize-observer @resize='onChatBoxResize' />
            <div v-for='(message, index) in displayMessages' :key='index' :style='{borderTop: index > 0 ? "1px solid lightgray" : "", padding: "8px 0", textAlign: "center", marginBottom: "4px"}'>
              <div style='font-size: 14px; color: gray'>
                {{ message.message }}
              </div>
            </div>
            <div v-if='lastDisplayMessage' style='padding: 8px 0; text-align: center; border-top: 1px solid lightgray; margin-bottom: 4px;'>
              <div style='font-size: 14px; color: gray;'>
                {{ lastDisplayMessage.message }}
              </div>
            </div>
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='inputPrompt'
            placeholder='听一段经文，让心静下来~'
            @enter='onPromptEnter'
            style='width: 540px; max-width: calc(100% - 8px);'
            :disabled='generating'
            :loading='generating'
          />
        </div>
      </div>
      <div v-if='selectingSpeaker' class='full-height q-pt-lg'>
        <RightFixArea :max-width='300' :margin-top='48'>
          <SimulatorList
            v-model:selected='speaker'
            @selected='onSimulatorSelected'
          />
        </RightFixArea>
      </div>
    </div>
  </q-page>
</template>

<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, setting, simulator } from 'src/localstores'
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'
import { QScrollArea } from 'quasar'

import BottomFixInput from '../input/BottomFixInput.vue'
import SimulatorList from '../list/SimulatorList.vue'
import RightFixArea from '../fixed/RightFixArea.vue'

const prompt = ref('般若波罗密心经')
const inputPrompt = ref(prompt.value)

const audioInput = ref(false)
const audioError = ref('')

const chatBox = ref<QScrollArea>()
const headHeight = ref(0)

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

const generating = ref(false)
const selectingSpeaker = ref(false)

const speaker = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const generate = (_prompt: string) => {
  generating.value = true

  displayMessages.value = []
  waitMessages.value = new Map<string, Message>()
  lastDisplayMessage.value = undefined as unknown as Message
  typingMessage.value = undefined as unknown as Message
  if (audioPlayer.value && audioPlayer.value.context) audioPlayer.value?.stop()
  audioPlayer.value = undefined as unknown as AudioPlayer

  entityBridge.ENianJing.request(_prompt, speaker.value.id, _model.value.id, (message: string, index: number, first: boolean, last: boolean, audio?: string) => {
    generating.value = false
    inputPrompt.value = ''

    waitMessages.value.set(`${message}-${index}`, {
      message,
      audio: audio as string,
      index,
      first,
      last,
      timestamp: Date.now()
    })
  })
}

watch(inputPrompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  generate(prompt.value)
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onPromptEnter = (_prompt: string) => {
  generate(_prompt)
  prompt.value = _prompt
}

const initializeNianjing = async () => {
  _model.value = await dbBridge._Model.model(await dbBridge._Model.topicModelId()) as model._Model
  speaker.value = await dbBridge._Simulator.randomPeek()

  generate(prompt.value)
}

onMounted(async () => {
  setting.Setting.setCurrentMenu('nianjing')

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      void initializeNianjing()
    })
  })

  typingTicker.value = window.setInterval(typing, typingInterval.value)

  bgPlayer.value = await AudioPlayer.play('http://8.133.205.39:81/download/mp3/qiaomuyu.mp3', true) as AudioPlayer
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

const onChatBoxResize = (size: { height: number }) => {
  chatBox.value?.setScrollPosition('vertical', size.height, 300)
}

const onHeadBoxResize = (size: { height: number }) => {
  headHeight.value = size.height
}

const onSimulatorSelected = (_simulator: simulator._Simulator) => {
  selectingSpeaker.value = false
  speaker.value = _simulator
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
