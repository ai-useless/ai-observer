import Taro from '@tarojs/taro'
import {
  ChatRequestPayload,
  ChatResponsePayload,
  ErrorResponsePayload,
  XiangshengEvent,
  XiangshengEventType
} from './runner'

type SearchResponseType = ChatResponsePayload | ErrorResponsePayload
export type ListenerFunc = (payload: SearchResponseType) => void

export class SearchWorker {
  // eslint-disable-next-line no-use-before-define
  private static _instance: SearchWorker | undefined = undefined

  private _worker: Taro.Worker | undefined = undefined

  // eslint-disable-next-line func-call-spacing
  private _listeners: Map<XiangshengEventType, ListenerFunc[]> = new Map<
  XiangshengEventType,
    ListenerFunc[]
  >()

  private constructor() {
    this._worker = Taro.createWorker('worker/worker/search/worker.js')

    this._worker.onMessage((payload: Taro.Worker.OnMessageCallbackResult) => {
      const event = payload.message as XiangshengEvent
      const listeners = this._listeners.get(event.type)
      if (!listeners) return
      listeners.forEach((f) => {
        f(event.payload as SearchResponseType)
      })
    })
  }

  public static getSearchWorker = () => {
    if (SearchWorker._instance) return SearchWorker._instance
    SearchWorker._instance = new SearchWorker()
    return SearchWorker._instance
  }

  public static send = (
    type: XiangshengEventType,
    payload?: ChatRequestPayload
  ) => {
    const worker = SearchWorker.getSearchWorker()._worker
    if (!worker) return
    worker.postMessage({
      type,
      payload
    })
  }

  public static on = (type: XiangshengEventType, listener: ListenerFunc) => {
    const listeners =
      SearchWorker.getSearchWorker()._listeners.get(type) || []
    listeners.push(listener)
    SearchWorker.getSearchWorker()._listeners.set(type, listeners)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static off = (type: XiangshengEventType, listener: ListenerFunc) => {
    const listeners =
      SearchWorker.getSearchWorker()._listeners.get(type) || []
    const index = listeners.findIndex((el) => el === listener)
    if (index < 0) return
    listeners.splice(index, 1)
    SearchWorker.getSearchWorker()._listeners.set(type, listeners)
  }

  public static terminate = () => {
    const worker = SearchWorker.getSearchWorker()._worker
    if (!worker) return
    worker.terminate()
  }
}
