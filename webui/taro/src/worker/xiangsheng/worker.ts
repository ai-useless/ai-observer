import {
  ChatRequestPayload,
  XiangshengEvent,
  XiangshengEventType,
  XiangshengRunner
} from './runner'

console.trace = () => {
  // DO NOTHING
}

self.onmessage = async (message: MessageEvent) => {
  const event = message.data as XiangshengEvent
  switch (event.type) {
    case XiangshengEventType.CHAT_REQUEST:
      return await XiangshengRunner.handleChatRequest(
        event.payload as ChatRequestPayload
      )
  }
}
