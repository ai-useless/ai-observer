import {
  FetchedPointsPayload,
  FetchPointsPayload,
  ChatEvent,
  ChatEventType,
  LoadedPointsPayload,
  LoadPointsPayload
} from './runner'

type ChatResponseType =
  | FetchedPointsPayload
  | LoadedPointsPayload
export type ListenerFunc = (payload: ChatResponseType) => void

export class ChatWorker {
  // eslint-disable-next-line no-use-before-define
  private static _instance: ChatWorker | undefined = undefined

  private _worker: Worker | undefined = undefined

  // eslint-disable-next-line func-call-spacing
  private _listeners: Map<ChatEventType, ListenerFunc> = new Map<
    ChatEventType,
    ListenerFunc
  >()

  private constructor() {
    this._worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module'
    })

    this._worker.onmessage = (message: MessageEvent) => {
      const event = message.data as ChatEvent
      this._listeners.get(event.type)?.(event.payload as ChatResponseType)
    }
  }

  public static getChatWorker = () => {
    if (ChatWorker._instance) return ChatWorker._instance
    ChatWorker._instance = new ChatWorker()
    return ChatWorker._instance
  }

  public static send = (
    type: ChatEventType,
    payload?:
      | FetchPointsPayload
      | LoadPointsPayload
  ) => {
    ChatWorker.getChatWorker()._worker?.postMessage({
      type,
      payload
    })
  }

  public static on = (type: ChatEventType, listener: ListenerFunc) => {
    ChatWorker.getChatWorker()._listeners.set(type, listener)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static off = (type: ChatEventType, listener: ListenerFunc) => {
    ChatWorker.getChatWorker()._listeners.delete(type)
  }

  public static terminate = () => {
    ChatWorker.getChatWorker()._worker?.terminate()
  }
}
