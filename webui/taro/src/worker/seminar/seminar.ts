import Taro from '@tarojs/taro'
import {
  ChatRequestPayload,
  ChatResponsePayload,
  ErrorResponsePayload,
  SeminarEvent,
  SeminarEventType
} from './runner'

type SeminarResponseType = ChatResponsePayload | ErrorResponsePayload
export type ListenerFunc = (payload: SeminarResponseType) => void

export class SeminarWorker {
  // eslint-disable-next-line no-use-before-define
  private static _instance: SeminarWorker | undefined = undefined

  private _worker: Taro.Worker | undefined = undefined

  // eslint-disable-next-line func-call-spacing
  private _listeners: Map<SeminarEventType, ListenerFunc[]> = new Map<
    SeminarEventType,
    ListenerFunc[]
  >()

  private constructor() {
    this._worker = Taro.createWorker('worker/worker/seminar/worker.js')

    this._worker.onMessage((payload: Taro.Worker.OnMessageCallbackResult) => {
      const event = payload.message as SeminarEvent
      const listeners = this._listeners.get(event.type)
      if (!listeners) return
      listeners.forEach((f) => {
        f(event.payload as SeminarResponseType)
      })
    })
  }

  public static getSeminarWorker = () => {
    if (SeminarWorker._instance) return SeminarWorker._instance
    SeminarWorker._instance = new SeminarWorker()
    return SeminarWorker._instance
  }

  public static send = (
    type: SeminarEventType,
    payload?: ChatRequestPayload
  ) => {
    const worker = SeminarWorker.getSeminarWorker()._worker
    if (!worker) return
    worker.postMessage({
      type,
      payload
    })
  }

  public static on = (type: SeminarEventType, listener: ListenerFunc) => {
    const listeners =
      SeminarWorker.getSeminarWorker()._listeners.get(type) || []
    listeners.push(listener)
    SeminarWorker.getSeminarWorker()._listeners.set(type, listeners)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static off = (type: SeminarEventType, listener: ListenerFunc) => {
    const listeners =
      SeminarWorker.getSeminarWorker()._listeners.get(type) || []
    const index = listeners.findIndex((el) => el === listener)
    if (index < 0) return
    listeners.splice(index, 1)
    SeminarWorker.getSeminarWorker()._listeners.set(type, listeners)
  }

  public static terminate = () => {
    const worker = SeminarWorker.getSeminarWorker()._worker
    if (!worker) return
    worker.terminate()
  }
}
