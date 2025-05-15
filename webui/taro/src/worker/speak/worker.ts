import { SpeakEvent, SpeakEventType, SpeakRunner, SpeakRequestPayload } from "./runner"

console.trace = () => {
  // DO NOTHING
}

self.onmessage = async (message: MessageEvent) => {
  const event = message.data as SpeakEvent
  switch (event.type) {
    case SpeakEventType.SPEAK_REQUEST:
      return await SpeakRunner.handleSpeakRequest(
        event.payload as SpeakRequestPayload
      )
  }
}
