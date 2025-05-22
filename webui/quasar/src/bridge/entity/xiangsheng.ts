import { dbModel } from '../../model'
import { imageWorker, xiangshengWorker } from '../../worker'
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

  participators = async () => {
    return EParticipator.simulators(
      await dbBridge._Participator.participators(this.xiangsheng.uid)
    )
  }

  speak = async (
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

    const host = await dbBridge._Participator.host(
      this.xiangsheng.uid
    ) as dbModel.Participator
    const guest = (
      await dbBridge._Participator.guests(
        this.xiangsheng.uid
      )
    )[0]

    const hostSimulator = await EParticipator.simulator(host)
    const guestSimulator = await EParticipator.simulator(guest)
    const participatorId = text.startsWith('逗')
      ? hostSimulator.participatorId
      : guestSimulator.participatorId

    xiangshengWorker.XiangshengRunner.handleSpeakRequest({
      participatorId,
      text: text
        .replace(/^逗[哏哙哭哐诨]\s*[:：]*\s*/, '')
        .replace(/捧[哏哙哭哐诨]\s*[:：]*\s*/, '')
    })
      .then((payload) => {
        const { audio } = payload as xiangshengWorker.SpeakResponsePayload
        void this.onMessage(
          `${topic}之${subTopic}`,
          participatorId,
          text
            .replace(/逗[哏哙哭哐诨]\s*[:：]*\s*/, '')
            .replace(/捧[哏哙哭哐诨]\s*[:：]*\s*/, ''),
          audio,
          index,
          index === 0,
          index === texts.length - 1
        )
        void this.speak(topic, subTopic, subTopicIndex, texts, index + steps, steps)
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed speak: ${e}`)
        void this.speak(topic, subTopic, subTopicIndex, texts, index, steps)
      })
  }

  onGenerateResponse = (message: xiangshengWorker.GenerateResponsePayload) => {
    const { texts, subTopicIndex, topic, subTopic } = message
    const steps = 10
    for (let i = 0; i < steps; i++) {
      void this.speak(topic, subTopic, subTopicIndex, texts, i, steps)
    }
  }

  onTopicsResponse = (message: xiangshengWorker.TopicsResponsePayload) => {
    this.subTopics.push(...message.topics)
    if (
      this.subTopicIndex < 0 ||
      this.subTopics.length - 1 <= this.subTopicIndex
    )
      void this.start()
  }

  onScriptsResponse = (
    message: xiangshengWorker.ClassicScriptsResponsePayload
  ) => {
    const { texts } = message
    const steps = 10
    const topic = texts.find((el) =>
      el.replace(' ', '').replace('#', '').replace('*', '').startsWith('标题')
    )
    const subTopic = topic ? (topic.replace(/标题[:：]*\s*/, '')) : ''

    this.subTopics.push(subTopic)
    this.subTopicIndex += 1

    for (let i = 0; i < steps; i++) {
      void this.speak('经典相声', subTopic, this.subTopicIndex, texts, i, steps)
    }
  }

  generateTopics = async () => {
    const host = await dbBridge._Participator.host(
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
            void this.generateTopics()
          }, 1000)
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed generate topics: ${e}`)
        setTimeout(() => {
          void this.generateTopics()
        }, 1000)
      })
  }

  changeTopic = async (topic: string) => {
    this.xiangsheng.topic = topic
    this.subTopics = []
    this.subTopicIndex = -1
    this.generating = false
    await this.generateTopics()
  }

  start = async () => {
    if (this.generating) return

    const host = await dbBridge._Participator.host(
      this.xiangsheng.uid
    ) as dbModel.Participator
    const guest = (
      await dbBridge._Participator.guests(
        this.xiangsheng.uid
      )
    )[0]

    if (this.subTopics.length - this.subTopicIndex <= 1) {
      await this.generateTopics()
      if (
        this.subTopicIndex < 0 ||
        this.subTopics.length - 1 <= this.subTopicIndex
      )
        return
    }

    this.generating = true

    const hostSimulator = await EParticipator.simulator(host)
    const guestSimulator = await EParticipator.simulator(guest)

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
        } else {
          setTimeout(() => {
            this.generating = false
            void this.start()
          }, 1000)
        }
      })
      .catch((e) => {
        this.generating = false
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed start xiangsheng: ${e}`)
        setTimeout(() => {
          void this.start()
        }, 1000)
      })
  }

  startScripts = async () => {
    if (this.generating) return

    this.generating = true

    xiangshengWorker.XiangshengRunner.handleClassicScriptsRequest({
      historyTopics: this.subTopics.map((el) => {
        return { message: el }
      }),
      modelId: await dbBridge._Model.topicModelId()
    })
      .then((payload) => {
        if (payload) {
          this.onScriptsResponse(payload)
        } else {
          setTimeout(() => {
            this.generating = false
            void this.startScripts()
          }, 1000)
        }
      })
      .catch((e) => {
        this.generating = false
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed start scripts: ${e}`)
        setTimeout(() => {
          void this.startScripts()
        }, 1000)
      })
  }

  stop = () => {
    // DO NOTHING
  }

  static prepareTopics = async (historyTopics: string[]) => {
    return await xiangshengWorker.XiangshengRunner.handleClassicTopicsRequest({
      historyTopics: historyTopics.map((el) => {
        return { message: el }
      }),
      modelId: await dbBridge._Model.topicModelId()
    })
  }

  generateStageBackground = async () => {
    const prompt = `相声舞台背景，暗红色调，背景墙有明显的 AGI相声社 标志，两个穿长衫大褂相声演员正在表演${this.xiangsheng.topic}，舞台上有桌子、道具、鲜花和话筒。相声演员使用卡通头像。捧哏演员看着逗哏演员，逗哏演员看着观众。`
    const payload = await imageWorker.ImageRunner.handleGenerateRequest({
      style: '漫画',
      prompt,
      dialog: false,
      extra: '',
      highResolution: true,
      ratio: '16:9'
    })
    if (!payload || !payload.image || !payload.image.length) return
    return payload.image
  }
}
