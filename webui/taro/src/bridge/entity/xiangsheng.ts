import { dbModel } from '../../model'
import { xiangshengWorker } from '../../worker'
import { dbBridge } from '..'
import { EParticipator } from './participator'

type MessageFunc = (
  xiangshengUid: string, participatorId: number, text: string, audio: string
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

  onChatResponse = (message: xiangshengWorker.ChatResponsePayload) => {
    const { xiangshengUid, participatorId, text, audio } =
      message

    void this.onMessage(
      xiangshengUid,
      participatorId,
      text,
      audio
    )
  }

  next = (role: string) => {
    const host = dbBridge._Participator.host(this.xiangsheng.uid) as dbModel.Participator
    const guest = (dbBridge._Participator.guests(this.xiangsheng.uid) as dbModel.Participator[])[0]

    const hostSimulator = EParticipator.simulator(host)
    const guestSimulator = EParticipator.simulator(guest)
    const historyMessages = this.historyMessages()

    xiangshengWorker.XiangshengRunner.handleChatRequest({
      topic: this.xiangsheng.topic,
      historyMessages,
      xiangshengUid: this.xiangsheng.uid,
      participatorId: role === '捧哏' ? guestSimulator.participatorId : hostSimulator.participatorId,
      modelId: host.modelId,
      role,
      partner: role === '逗哏' ? guestSimulator.simulator.simulator : hostSimulator.simulator.simulator,
      mySelf: role === '捧哏' ? guestSimulator.simulator.simulator : hostSimulator.simulator.simulator
    })
      .then((payload) => {
        if (payload) this.onChatResponse(payload)
        else
          setTimeout(() => {
            this.next(role)
          }, 1000)
      })
      .catch((e) => {
        console.log(`Failed continue xiangsheng: ${e}`)
        setTimeout(() => {
          this.next(role)
        }, 1000)
      })
  }

  start = () => {
    this.next('逗哏')
  }

  stop = () => {}
}
