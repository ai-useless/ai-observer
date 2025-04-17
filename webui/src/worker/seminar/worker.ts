import { ChatRequestPayload, SeminarEvent, SeminarEventType, SeminarRunner } from './runner'

console.trace = () => {
  // DO NOTHING
}

self.onmessage = async (message: MessageEvent) => {
  console.log('test onmessage: ', message)
  const event = message.data as SeminarEvent
  switch (event.type) {
    case SeminarEventType.CHAT_REQUEST:
      return await SeminarRunner.handleChatRequest(
        event.payload as ChatRequestPayload
      )
  }
}
