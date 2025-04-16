<template>
  <div>
    <div class='row kline'>
      <input 
          v-model="sessionId" 
          type="text" 
          placeholder="请输入sessionID..." 
        />
      <input 
          v-model="discussionTopic" 
          type="text" 
          placeholder="请输入讨论主题..." 
          @keyup.enter="startDiscussion"
        />
      <button @click="newSession">新会话</button>
      <button @click="startDiscussion">开始讨论</button>
      <button @click="loadInputSession">加载指定会话</button>
      <q-space />
      <div v-for="(id, index) in sessionIds" :key="index" class="message-container">
        <button @click='loadTargetSession(id)'>会话ID: {{ id }}</button>
      </div>
      <q-space />
      <div v-for="(message, index) in messages" :key="index" class="message-container">
        <div class="ai-message-wrapper">
          {{ message.content }}
        </div>
      </div>
    </div>
    <q-separator />
  </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { chatWorker } from 'src/worker'
import { SendMessage, MsgData, SessionMsg } from 'src/localstore/chat/types'
import { generateUUID } from 'src/utils/uuid'
import { getCurrentFormattedDate } from 'src/utils/timestamp'

// new
const discussionTopic = ref('')
const sessionId = ref('')
// 展示在前端的回复
const messages = ref<MsgData[]>([])
const allMessages = ref<SessionMsg[]>()
const firstLoad = ref(true)
const sessionIds = ref<string[]>([])

const newSession = async () => {
  sessionId.value = generateUUID()
  sessionIds.value = [...sessionIds.value, sessionId.value]
  messages.value = []
}

const startDiscussion = async () => {
  if (!discussionTopic.value) {
    alert('请输入讨论主题');
    return;
  }

  // 发送讨论问题
  const userMsg = {
    date_time: getCurrentFormattedDate(),
    participant_id: 'user',
    content: discussionTopic.value,
    isThinking: false,
    isSpeaking: false
  } as MsgData
  messages.value = [...messages.value, userMsg]

  chatWorker.ChatWorker.send(chatWorker.ChatEventType.FETCH_POINTS, {
    session_id: sessionId.value,
    ai: 'AI1',
    participant_id: 'host',
    messages: [{role:"user", content: discussionTopic.value} as SendMessage]
  })
}

const loadHistorySession = async () => {
  // 加载历史会话
  chatWorker.ChatWorker.send(chatWorker.ChatEventType.LOAD_POINTS, {
    offset: 0,
    limit: 100
  })
}

const loadInputSession = async () => {
  if (!sessionId.value) {
    alert('请输入会话ID')
    return
  }
 
  const targetSessionMsg = allMessages.value?.filter((msgs) => msgs.session_id === sessionId.value)
  if (targetSessionMsg) {
    messages.value = []
    targetSessionMsg.forEach((obj) => {
      messages.value = [...messages.value, ...obj.data]
    })
  }
}

const loadTargetSession = async (sid: string) => {
  if (!sid) {
    alert('请输入会话ID')
    return
  }
  const targetSessionMsg = allMessages.value?.filter((msgs) => msgs.session_id === sid)
  if (targetSessionMsg) {
    messages.value = []
    targetSessionMsg.forEach((obj) => {
      messages.value = [...messages.value, ...obj.data]
    })
  }
}

const onFetchedPoints = (payload: chatWorker.FetchedPointsPayload) => {
  const _points = payload
  const msgs = _points.msgs
  msgs.forEach((obj) => {
    messages.value = [...messages.value, ...obj.data]
  })
}

const onLoadedPoints = (payload: chatWorker.LoadedPointsPayload) => {
  const _points = payload
  if (!sessionId.value) {
    sessionId.value = _points.msgs[0].session_id
  }
  allMessages.value = _points.msgs
  allMessages.value.forEach((obj) => {
    sessionIds.value = [...sessionIds.value, obj.session_id]
  })
  const msgs = _points.msgs.filter((obj) => obj.session_id === sessionId.value)
  if (firstLoad) {
    msgs.forEach((obj) => {
      messages.value = [...obj.data]
    })
    firstLoad.value = false
    return
  }
  messages.value = [...msgs[msgs.length-1].data]
}

onMounted(() => {
  chatWorker.ChatWorker.on(chatWorker.ChatEventType.FETCHED_POINTS, onFetchedPoints as chatWorker.ListenerFunc)
  chatWorker.ChatWorker.on(chatWorker.ChatEventType.LOADED_POINTS, onLoadedPoints as chatWorker.ListenerFunc)

  // 加载最新的session内容
  loadHistorySession()
})

onBeforeUnmount(() => {
  chatWorker.ChatWorker.off(chatWorker.ChatEventType.FETCHED_POINTS, onFetchedPoints as chatWorker.ListenerFunc)
  chatWorker.ChatWorker.off(chatWorker.ChatEventType.LOADED_POINTS, onLoadedPoints as chatWorker.ListenerFunc)
})

</script>

<style scoped lang="sass">
.kline
  border-top: 1px solid $grey-4

.ai-message-wrapper
  display: flex
  align-items: flex-start

.message-container
  margin-bottom: 20px

</style>
