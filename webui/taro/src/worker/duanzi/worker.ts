import {
  GenerateRequestPayload,
  DuanziEvent,
  DuanziEventType,
  DuanziRunner
} from './runner'

console.trace = () => {
  // DO NOTHING
}

self.onmessage = async (message: MessageEvent) => {
  const event = message.data as DuanziEvent
  switch (event.type) {
    case DuanziEventType.GENERATE_REQUEST:
      return await DuanziRunner.handleGenerateRequest(
        event.payload as GenerateRequestPayload
      )
  }
}
