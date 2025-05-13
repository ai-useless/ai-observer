import {
  SearchRequestPayload,
  SearchEvent,
  SearchEventType,
  SearchRunner
} from './runner'

console.trace = () => {
  // DO NOTHING
}

self.onmessage = async (message: MessageEvent) => {
  const event = message.data as SearchEvent
  switch (event.type) {
    case SearchEventType.SEARCH_REQUEST:
      return await SearchRunner.handleSearchRequest(
        event.payload as SearchRequestPayload
      )
  }
}
