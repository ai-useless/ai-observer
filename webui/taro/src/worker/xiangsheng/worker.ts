import {
  GenerateRequestPayload,
  SpeakRequestPayload,
  TopicsRequestPayload,
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
    case XiangshengEventType.GENERATE_REQUEST:
      return await XiangshengRunner.handleGenerateRequest(
        event.payload as GenerateRequestPayload
      )
    case XiangshengEventType.SPEAK_REQUEST:
      return await XiangshengRunner.handleSpeakRequest(
        event.payload as SpeakRequestPayload
      )
    case XiangshengEventType.TOPICS_REQUEST:
      return await XiangshengRunner.handleTopicsRequest(
        event.payload as TopicsRequestPayload
      )
  }
}
