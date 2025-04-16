import {
  FetchPointsPayload,
  ChatEvent,
  ChatEventType,
  ChatRunner,
  LoadPointsPayload
} from './runner'

console.trace = () => {
  // DO NOTHING
}

self.onmessage = async (message: MessageEvent) => {
  const event = message.data as ChatEvent
  switch (event.type) {
    case ChatEventType.FETCH_POINTS:
      return await ChatRunner.handleFetchPoints(
        event.payload as FetchPointsPayload
      )
    case ChatEventType.LOAD_POINTS:
      return await ChatRunner.handleLoadPoints(
        event.payload as LoadPointsPayload
      )
  }
}
