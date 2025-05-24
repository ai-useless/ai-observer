<template>
  <q-page>
    <div style='width: 100%; height: 100vh;' class='flex justify-center items-center'>
      <div style='height: 100vh; width: min(100%, 600px);' class='bg-grey-2'>
        <div class='full-width text-center q-py-sm text-bold text-grey-9'>
          {{ friend?.simulator }} | {{ _model?.name }}
        </div>
        <q-separator />
        <q-scroll-area
          style='height: calc(100% - 56px - 32px - 16px - 16px); width: 100%; padding: 8px 16px;'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div style='font-size: 14px;'>
            <div v-for='(_message, index) in messages' :key='index' :style='{display: "flex", padding: "4px 0", flexDirection: _message.send ? "row-reverse" : "row"}'>
              <div v-if='!_message.send'>
                <q-img :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
              </div>
              <div v-else style='margin-left: 8px;'>
                <q-img :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
              </div>
              <div style='margin-left: 16px;'>
                <div :style='{backgroundColor: _message.hint ? "rgba(160, 160, 160, 0.2)" : _message.send ? "#07c160" : "white", color: _message.hint ? "black" : _message.send ? "white" : "black", borderRadius: _message.send ? "16px 16px 0 16px" : "16px 16px 16px 0", padding: "8px", border: "1px solid rgba(200, 200, 200, 0.3)"}'>
                  <div>{{ _message.message }}</div>
                </div>
                <div style='margin-top: 4px; font-size: 12px; color: gray;'>
                  {{ _message.displayTime }}
                </div>
              </div>
            </div>
            <div class='full-width flex justify-center items-center'>
              <q-btn
                flat
                dense
                v-if='friendThinking'
                :loading='true'
                color='grey-6'
                class='full-width'
              >
                <template #loading>
                  <div class='row full-width flex justify-center items-center'>
                    <q-spinner-dots size='20px' class='q-mr-sm' />
                    对方正在思考...
                  </div>
                </template>
              </q-btn>
            </div>
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='message'
            placeholder='随便聊点儿啥~'
            @enter='onMessageEnter'
            :max-width='560'
          />
        </div>
      </div>
      <div class='q-ml-lg full-height q-pt-lg'>
        <RightFixArea :max-width='300'>
          <SimulatorList
            v-model:selected='friend'
            @selected='onSimulatorSelected'
          />
        </RightFixArea>
      </div>
    </div>
    <q-dialog v-model='logining' persistent>
      <WechatLogin @cancel='onCancelLogin' />
    </q-dialog>
  </q-page>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref, toRef, watch, defineProps } from 'vue'
import { model, setting, simulator, user } from 'src/localstores'
import { dbBridge, entityBridge } from 'src/bridge'
import { AudioPlayer } from 'src/player'
import { useRouter } from 'vue-router'

import BottomFixInput from '../input/BottomFixInput.vue'
import RightFixArea from '../fixed/RightFixArea.vue'
import WechatLogin from '../login/WechatLogin.vue'
import SimulatorList from '../list/SimulatorList.vue'

interface Props {
  language: string
}

const props = defineProps<Props>()
const language = toRef(props, 'language')

interface Message {
  message: string
  send: boolean
  createdAt: number
  displayTime?: string
  displayName: string
  avatar: string
  hint: boolean
  audio?: string
}

const message = ref('')
const audioError = ref('')

const messages = ref([] as Message[])

const friend = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const userAvatar = computed(() => user.User.avatarUrl())
const username = computed(() => user.User.username())

const audioInput = ref(false)

const friendThinking = ref(false)
const logining = ref(false)

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const router = useRouter()

const sendToFriend = (_message: string) => {
  friendThinking.value = true
  entityBridge.EChat.chat(friend.value.id, friend.value.simulator, friend.value.origin_personality, username.value, [...messages.value.map((el) => `${el.send ? friend.value.simulator : username.value}: ${el.message}`), _message], _model.value.id, language.value || '中文', (_message?: string, audio?: string, error?: string) => {
    friendThinking.value = false
    if (error && error.length) {
      messages.value.push({
        message: error,
        send: false,
        createdAt: Date.now(),
        displayName: friend.value.simulator,
        hint: true,
        avatar: friend.value.simulator_avatar_url
      })
      return
    }
    messages.value.push({
      message: _message as string,
      send: false,
      createdAt: Date.now(),
      displayName: friend.value.simulator,
      hint: false,
      avatar: friend.value.simulator_avatar_url,
      audio
    })
    if (audio) {
      AudioPlayer.play(audio).then((player) => {
        if (!player) return
        audioPlayer.value = player
      }).catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed play audio: ${e}`)
      })
    }
  })
}

watch(message, () => {
  if (!audioInput.value || !message.value || !message.value.length) return

  messages.value.push({
    message: message.value,
    send: true,
    createdAt: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value
  })

  sendToFriend(message.value)
  message.value = ''
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  messages.value.push({
    message: audioError.value,
    send: true,
    createdAt: Date.now(),
    displayName: username.value,
    hint: true,
    avatar: userAvatar.value
  })

  audioError.value = ''
})

const onMessageEnter = (_message: string) => {
  messages.value.push({
    message: _message,
    send: true,
    createdAt: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value
  })

  sendToFriend(message.value)
  message.value = ''
}

watch(userAvatar, () => {
  if (userAvatar.value && userAvatar.value.length && username.value && username.value.length) {
    logining.value = false
  }
})

watch(username, () => {
  if (userAvatar.value && userAvatar.value.length && username.value && username.value.length) {
    logining.value = false
  }
})

const initializeMessage = () => {
  messages.value = [{
    message: language.value === '中文'
      ? `您好，我是${friend.value.simulator}，是你在AGI世界的伙伴。我的模型是${_model.value.name}。你可以和我聊任何你想聊的话题，记得要健康哦！如果你想和其他伙伴沟通，可以点击对话框旁边的按钮切换伙伴哦！现在，开始我们愉快的聊天吧！`
      : `Hello, I'm ${friend.value.simulator}, your friend in AGI world. I'm driven by llm model ${_model.value.name}. Now you can talk with me about any topic. If you would like to chat with other guys, switch with button besides the input box. Now let's go!`,
    send: false,
    createdAt: Date.now(),
    displayName: friend.value.simulator,
    hint: true,
    avatar: friend.value.simulator_avatar_url
  }]
}

const initializeChat = async () => {
  _model.value = await dbBridge._Model.model(await dbBridge._Model.chatModelId()) as model._Model
  friend.value = await dbBridge._Simulator.randomPeek(undefined)
  initializeMessage()
}

onMounted(() => {
  setting.Setting.setCurrentMenu(language.value === '中文' ? 'chat' : 'english')

  if (!userAvatar.value || !userAvatar.value.length || !username.value || !username.value.length) {
    logining.value = true
  }

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      void initializeChat()
    })
  })
})

const onSimulatorSelected = (_simulator: simulator._Simulator) => {
  friend.value = _simulator
  initializeMessage()
}

const onCancelLogin = () => {
  logining.value = false
  void router.push({ path: '/' })
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
