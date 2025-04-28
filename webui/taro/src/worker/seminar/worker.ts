import {
  ChatRequestPayload,
  GenerateTopicsPayload,
  SeminarEvent,
  SeminarEventType,
  SeminarRunner
} from './runner'

console.trace = () => {
  // DO NOTHING
}

self.onmessage = async (message: MessageEvent) => {
  const event = message.data as SeminarEvent
  switch (event.type) {
    case SeminarEventType.CHAT_REQUEST:
      return await SeminarRunner.handleChatRequest(
        event.payload as ChatRequestPayload
      )
    case SeminarEventType.GENERATE_TOPICS:
      return await SeminarRunner.handleGenerateTopics(
        event.payload as GenerateTopicsPayload
      )
  }
}
