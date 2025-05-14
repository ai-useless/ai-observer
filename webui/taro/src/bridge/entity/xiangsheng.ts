import { dbModel } from '../../model'
import { xiangshengWorker } from '../../worker'
import { dbBridge } from '..'
import { EParticipator } from './participator'

type MessageFunc = (
  xiangshengUid: string,
  participatorId: number,
  text: string,
  audio: string,
  index: number
) => void | Promise<void>
type HistoryMessagesFunc = () => xiangshengWorker.HistoryMessage[]

export class EXiangsheng {
  private xiangsheng = undefined as unknown as dbModel.Xiangsheng

  private onMessage = undefined as unknown as MessageFunc
  private historyMessages = undefined as unknown as HistoryMessagesFunc

  constructor(
    xiangsheng: dbModel.Xiangsheng,
    onMessage: MessageFunc,
    historyMessages: HistoryMessagesFunc
  ) {
    this.xiangsheng = xiangsheng
    this.onMessage = onMessage
    this.historyMessages = historyMessages
  }

  participators = () => {
    return EParticipator.simulators(
      dbBridge._Participator.participators(this.xiangsheng.uid)
    )
  }

  speak = (texts: string[], index: number, steps: number) => {
    if (index >= texts.length) return

    const text = texts[index]

    const host = dbBridge._Participator.host(
      this.xiangsheng.uid
    ) as dbModel.Participator
    const guest = (
      dbBridge._Participator.guests(
        this.xiangsheng.uid
      ) as dbModel.Participator[]
    )[0]

    const hostSimulator = EParticipator.simulator(host)
    const guestSimulator = EParticipator.simulator(guest)
    const participatorId = text.startsWith('逗哏') ? hostSimulator.participatorId : guestSimulator.participatorId

    xiangshengWorker.XiangshengRunner.handleSpeakRequest({
      participatorId,
      text: text.replace(/逗哏\s*[:：]\s*/, '').replace(/捧哏\s*[:：]\s*/, '')
    }).then((payload) => {
      const { audio } = payload as xiangshengWorker.SpeakResponsePayload
      void this.onMessage(this.xiangsheng.uid, participatorId, text.replace(/逗哏\s*[:：]\s*/, '').replace(/捧哏\s*[:：]\s*/, ''), audio, index)
      this.speak(texts, index + steps, steps)
    }).catch((e) => {
      console.log(`Failed speak: ${e}`)
      this.speak(texts, index, steps)
    })
  }

  onGenerateResponse = (message: xiangshengWorker.GenerateResponsePayload) => {
    const { texts } = message
    const steps = 5
    for (let i = 0; i < steps; i++) {
      this.speak(texts, i, steps)
    }
  }

  start = () => {
    const host = dbBridge._Participator.host(
      this.xiangsheng.uid
    ) as dbModel.Participator

    const historyMessages = this.historyMessages()

    xiangshengWorker.XiangshengRunner.handleGenerateRequest({
      topic: this.xiangsheng.topic,
      historyMessages,
      xiangshengUid: this.xiangsheng.uid,
      modelId: host.modelId
    })
      .then((payload) => {
        if (payload) {
          this.onGenerateResponse(payload)
        } else
          setTimeout(() => {
            this.start()
          }, 1000)
      })
      .catch((e) => {
        console.log(`Failed start xiangsheng: ${e}`)
        setTimeout(() => {
          this.start()
        }, 1000)
      })
  }

  stop = () => {}
}
