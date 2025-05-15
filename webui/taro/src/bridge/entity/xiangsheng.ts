import { dbModel } from '../../model'
import { xiangshengWorker } from '../../worker'
import { dbBridge } from '..'
import { EParticipator } from './participator'

type MessageFunc = (
  xiangshengUid: string,
  participatorId: number,
  text: string,
  audio: string,
  index: number,
  first: boolean,
  last: boolean
) => void | Promise<void>
type HistoryMessagesFunc = () => xiangshengWorker.HistoryMessage[]

export class EXiangsheng {
  private xiangsheng = undefined as unknown as dbModel.Xiangsheng
  private subTopicIndex = -1
  private subTopics = [] as string[]

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

  speak = (subTopicIndex: number, texts: string[], index: number, steps: number) => {
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
    const participatorId = text.startsWith('逗哏')
      ? hostSimulator.participatorId
      : guestSimulator.participatorId

    xiangshengWorker.XiangshengRunner.handleSpeakRequest({
      participatorId,
      text: text.replace(/逗哏\s*[:：]\s*/, '').replace(/捧哏\s*[:：]\s*/, '')
    })
      .then((payload) => {
        const { audio } = payload as xiangshengWorker.SpeakResponsePayload
        void this.onMessage(
          `${this.xiangsheng.topic}之${this.subTopics[subTopicIndex]}`,
          participatorId,
          text.replace(/逗哏\s*[:：]\s*/, '').replace(/捧哏\s*[:：]\s*/, ''),
          audio,
          index,
          index === 0,
          index === texts.length - 1
        )
        this.speak(subTopicIndex, texts, index + steps, steps)
      })
      .catch((e) => {
        console.log(`Failed speak: ${e}`)
        this.speak(subTopicIndex, texts, index, steps)
      })
  }

  onGenerateResponse = (message: xiangshengWorker.GenerateResponsePayload) => {
    const { texts, subTopicIndex } = message
    const steps = 5
    for (let i = 0; i < steps; i++) {
      this.speak(subTopicIndex, texts, i, steps)
    }
  }

  onTopicsResponse = (message: xiangshengWorker.TopicsResponsePayload) => {
    this.subTopics.push(...message.topics)
    if (this.subTopicIndex < 0) this.start()
  }

  generateTopics = () => {
    const host = dbBridge._Participator.host(
      this.xiangsheng.uid
    ) as dbModel.Participator

    xiangshengWorker.XiangshengRunner.handleTopicsRequest({
      topic: this.xiangsheng.topic,
      historySubTopics: this.subTopics.map((el) => {
        return { message: el }
      }),
      xiangshengUid: this.xiangsheng.uid,
      modelId: host.modelId
    })
      .then((payload) => {
        if (payload) {
          this.onTopicsResponse(payload)
        } else
          setTimeout(() => {
            this.generateTopics()
          }, 1000)
      })
      .catch((e) => {
        console.log(`Failed generate topics: ${e}`)
        setTimeout(() => {
          this.generateTopics()
        }, 1000)
      })
  }

  start = (_subTopicIndex?: number) => {
    const host = dbBridge._Participator.host(
      this.xiangsheng.uid
    ) as dbModel.Participator
    const guest = (
      dbBridge._Participator.guests(
        this.xiangsheng.uid
      ) as dbModel.Participator[]
    )[0]

    if (this.subTopicIndex < 0 && this.subTopics.length - this.subTopicIndex <= 1) {
      this.generateTopics()
      if (this.subTopicIndex < 0) return
    }

    const hostSimulator = EParticipator.simulator(host)
    const guestSimulator = EParticipator.simulator(guest)

    const subTopicIndex = _subTopicIndex === undefined ? (this.subTopicIndex + 1) : _subTopicIndex
    this.subTopicIndex = subTopicIndex

    xiangshengWorker.XiangshengRunner.handleGenerateRequest({
      topic: this.subTopics[subTopicIndex],
      subTopicIndex,
      host: hostSimulator.simulator.simulator,
      guest: guestSimulator.simulator.simulator,
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
