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

export class EXiangsheng {
  private xiangsheng = undefined as unknown as dbModel.Xiangsheng
  private subTopicIndex = -1
  private subTopics = [] as string[]
  private generating = false

  private onMessage = undefined as unknown as MessageFunc

  constructor(xiangsheng: dbModel.Xiangsheng, onMessage: MessageFunc) {
    this.xiangsheng = xiangsheng
    this.onMessage = onMessage
  }

  participators = () => {
    return EParticipator.simulators(
      dbBridge._Participator.participators(this.xiangsheng.uid)
    )
  }

  speak = (
    topic: string,
    subTopic: string,
    subTopicIndex: number,
    texts: string[],
    index: number,
    steps: number
  ) => {
    if (index >= texts.length) {
      this.generating = false
      return
    }

    const text = texts[index].replace('#', '').replace('*', '').replace(' ', '')

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
    const participatorId = text.startsWith('逗')
      ? hostSimulator.participatorId
      : guestSimulator.participatorId

    xiangshengWorker.XiangshengRunner.handleSpeakRequest({
      participatorId,
      text: text
        .replace(/^逗[哏哙哭哐]\s*[:：]*\s*/, '')
        .replace(/捧[哏哙哭哐]\s*[:：]*\s*/, '')
    })
      .then((payload) => {
        const { audio } = payload as xiangshengWorker.SpeakResponsePayload
        void this.onMessage(
          `${topic}之${subTopic}`,
          participatorId,
          text
            .replace(/逗[哏哙哭哐]\s*[:：]*\s*/, '')
            .replace(/捧[哏哙哭哐]\s*[:：]*\s*/, ''),
          audio,
          index,
          index === 0,
          index === texts.length - 1
        )
        this.speak(topic, subTopic, subTopicIndex, texts, index + steps, steps)
      })
      .catch((e) => {
        console.log(`Failed speak: ${e}`)
        this.speak(topic, subTopic, subTopicIndex, texts, index, steps)
      })
  }

  onGenerateResponse = (message: xiangshengWorker.GenerateResponsePayload) => {
    const { texts, subTopicIndex, topic, subTopic } = message
    const steps = 5
    for (let i = 0; i < steps; i++) {
      this.speak(topic, subTopic, subTopicIndex, texts, i, steps)
    }
  }

  onTopicsResponse = (message: xiangshengWorker.TopicsResponsePayload) => {
    this.subTopics.push(...message.topics)
    if (
      this.subTopicIndex < 0 ||
      this.subTopics.length - 1 <= this.subTopicIndex
    )
      this.start()
  }

  onScriptsResponse = (
    message: xiangshengWorker.ClassicScriptsResponsePayload
  ) => {
    const { texts } = message
    const steps = 5
    const topic = texts
      .find((el) =>
        el.replace(' ', '').replace('#', '').replace('*', '').startsWith('标题')
      )
    const subTopic = topic ? topic.replace(/标题[:：]*\s*/, '') as string : ''

    this.subTopics.push(subTopic)
    this.subTopicIndex += 1

    for (let i = 0; i < steps; i++) {
      this.speak('经典相声', subTopic, this.subTopicIndex, texts, i, steps)
    }
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

  changeTopic = (topic: string) => {
    this.xiangsheng.topic = topic
    this.subTopics = []
    this.subTopicIndex = -1
    this.generating = false
    this.generateTopics()
  }

  start = () => {
    if (this.generating) return

    const host = dbBridge._Participator.host(
      this.xiangsheng.uid
    ) as dbModel.Participator
    const guest = (
      dbBridge._Participator.guests(
        this.xiangsheng.uid
      ) as dbModel.Participator[]
    )[0]

    if (this.subTopics.length - this.subTopicIndex <= 1) {
      this.generateTopics()
      if (
        this.subTopicIndex < 0 ||
        this.subTopics.length - 1 <= this.subTopicIndex
      )
        return
    }

    this.generating = true

    const hostSimulator = EParticipator.simulator(host)
    const guestSimulator = EParticipator.simulator(guest)

    const subTopicIndex = this.subTopicIndex + 1
    this.subTopicIndex = subTopicIndex

    xiangshengWorker.XiangshengRunner.handleGenerateRequest({
      topic: this.xiangsheng.topic,
      subTopic: this.subTopics[subTopicIndex],
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
        this.generating = true
        console.log(`Failed start xiangsheng: ${e}`)
        setTimeout(() => {
          this.start()
        }, 1000)
      })
  }

  startScripts = () => {
    if (this.generating) return

    this.generating = true

    xiangshengWorker.XiangshengRunner.handleClassicScriptsRequest({
      historyTopics: this.subTopics.map((el) => {
        return { message: el }
      }),
      modelId: dbBridge._Model.topicModelId()
    })
      .then((payload) => {
        if (payload) {
          this.onScriptsResponse(payload)
        } else
          setTimeout(() => {
            this.startScripts()
          }, 1000)
      })
      .catch((e) => {
        this.generating = true
        console.log(`Failed start scripts: ${e}`)
        setTimeout(() => {
          this.startScripts()
        }, 1000)
      })
  }

  stop = () => {}

  static prepareTopics = async (historyTopics: string[]) => {
    return await xiangshengWorker.XiangshengRunner.handleClassicTopicsRequest({
      historyTopics: historyTopics.map((el) => {
        return { message: el }
      }),
      modelId: dbBridge._Model.topicModelId()
    })
  }
}
