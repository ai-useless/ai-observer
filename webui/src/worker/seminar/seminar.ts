import {
  ChatRequestPayload,
  ChatResponsePayload,
  SeminarEvent,
  SeminarEventType
} from './runner'

type SeminarResponseType = ChatResponsePayload
export type ListenerFunc = (payload: SeminarResponseType) => void

export class SeminarWorker {
  // eslint-disable-next-line no-use-before-define
  private static _instance: SeminarWorker | undefined = undefined

  private _worker: Worker | undefined = undefined

  // eslint-disable-next-line func-call-spacing
  private _listeners: Map<SeminarEventType, ListenerFunc> = new Map<
    SeminarEventType,
    ListenerFunc
  >()

  private constructor() {
    this._worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module'
    })

    this._worker.onmessage = (message: MessageEvent) => {
      const event = message.data as SeminarEvent
      this._listeners.get(event.type)?.(event.payload as SeminarResponseType)
    }
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
    SeminarWorker.getSeminarWorker()._worker?.postMessage({
      type,
      payload
    })
  }

  public static on = (type: SeminarEventType, listener: ListenerFunc) => {
    SeminarWorker.getSeminarWorker()._listeners.set(type, listener)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static off = (type: SeminarEventType, listener: ListenerFunc) => {
    SeminarWorker.getSeminarWorker()._listeners.delete(type)
  }

  public static terminate = () => {
    SeminarWorker.getSeminarWorker()._worker?.terminate()
  }
}
