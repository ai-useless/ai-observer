import { dbModel } from 'src/model'
import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'

type MessageFunc = (
  subTopic: string,
  participatorId: number,
  message: string,
  round: number,
  audio: string,
  duration: number
) => void | Promise<void>
type ThinkingFunc = (participatorId: number) => void
type OutlineFunc = (json: Record<string, unknown>) => void
type HistoryMessagesFunc = () => Map<number, string[]>

export class ESeminar {
  #seminar = undefined as unknown as dbModel.Seminar
  #onMessage = undefined as unknown as MessageFunc
  #onThinking = undefined as unknown as ThinkingFunc
  #onOutline = undefined as unknown as OutlineFunc
  #historyMessages = undefined as unknown as HistoryMessagesFunc

  #onGoingSubTopic = 0
  #topicMaterial = undefined as unknown as string
  #subTopics = [] as string[]

  #totalTopics = 8
  #subRound = 0
  // At least 2 for sub topic start
  #subRounds = 2
  #round = 0
  #canNext = false

  constructor(
    seminar: dbModel.Seminar,
    onMessage: MessageFunc,
    onThinking: ThinkingFunc,
    onOutline: OutlineFunc,
    historyMessages: HistoryMessagesFunc
  ) {
    this.#seminar = seminar
    this.#onMessage = onMessage
    this.#onThinking = onThinking
    this.#onOutline = onOutline
    this.#historyMessages = historyMessages
  }

  participators = async () => {
    return await dbBridge._Participator.participators(this.#seminar.uid)
  }

  host = async () => {
    return (await this.participators()).find(
      (el) => el.role === dbModel.Role.HOST
    )
  }

  onChatResponse = (message: seminarWorker.ChatResponsePayload) => {
    if (message.seminarId !== this.#seminar.id) return

    const { intent, subTopic, participatorId, payload } = message

    // Outline round
    if (intent === seminarWorker.Intent.OUTLINE) {
      this.#onOutline(message.payload.json)
      this.#topicMaterial = message.payload.text
      this.#subTopics = message.payload.json.titles as string[]
      void this.startTopic()
    }
    // Start topic round
    if (intent === seminarWorker.Intent.START_TOPIC || intent === seminarWorker.Intent.CONCLUDE_SUBTOPIC) {
      console.log('Conclude topic', subTopic)
      void this.startNextSubTopic()
      this.#subRound += 1
    }
    if (intent === seminarWorker.Intent.START_FIRST_SUBTOPIC || intent === seminarWorker.Intent.START_SUBTOPIC) {
      console.log('Start topic', this.#subRound, subTopic)
      this.#canNext = true
    }
    if (this.#subRound === this.#subRounds && intent === seminarWorker.Intent.DISCUSS) {
      console.log('Round done', this.#subRound, subTopic)
      this.#canNext = false
      void this.concludeSubTopic()
      if (this.#subTopics[this.#subTopics.length - 1] === subTopic)
        void this.concludeTopic()
    }

    void this.#onMessage(
      subTopic,
      participatorId,
      payload.text,
      this.#round,
      payload.audio,
      payload.duration
    )
  }

  onError = (error: seminarWorker.ErrorResponsePayload) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed request: [${JSON.stringify(error)}]`)
    setTimeout(() => {
      this.host()
        .then(() => {
          seminarWorker.SeminarWorker.send(
            seminarWorker.SeminarEventType.CHAT_REQUEST,
            error.payload
          )
        })
        .catch(() => {
          // DO NOTHING
        })
    }, 1000)
  }

  shouldNext = () => {
    return this.#canNext
  }

  start = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    seminarWorker.SeminarWorker.on(
      seminarWorker.SeminarEventType.CHAT_RESPONSE,
      this.onChatResponse as seminarWorker.ListenerFunc
    )
    seminarWorker.SeminarWorker.on(
      seminarWorker.SeminarEventType.ERROR,
      this.onError as seminarWorker.ListenerFunc
    )

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic: undefined as unknown as string,
        participatorId: host.id as number,
        intent: seminarWorker.Intent.OUTLINE,
        prompts: {
          rounds: this.#totalTopics
        }
      }
    )

    this.#onThinking(host.id as number)
  }

  startTopic = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic: undefined as unknown as string,
        participatorId: host.id as number,
        intent: seminarWorker.Intent.START_TOPIC,
        prompts: {
          topicMaterial: this.#topicMaterial,
          generateAudio: false
        }
      }
    )
  }

  startNextSubTopic = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')
    if (!this.#subTopics.length) return

    console.log(this.#subTopics)

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic: this.#subTopics[this.#onGoingSubTopic],
        participatorId: host.id as number,
        intent:
          this.#onGoingSubTopic === 0
            ? seminarWorker.Intent.START_FIRST_SUBTOPIC
            : seminarWorker.Intent.START_SUBTOPIC,
        prompts: {
          topicMaterial: this.#topicMaterial,
          generateAudio: true
        }
      }
    )
  }

  concludeSubTopic = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    this.#subRound = 0

    const historyMessages =
      this.#historyMessages().get(this.#onGoingSubTopic) || []

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic: this.#subTopics[this.#onGoingSubTopic],
        participatorId: host.id as number,
        intent: seminarWorker.Intent.CONCLUDE_SUBTOPIC,
        prompts: {
          generateAudio: true,
          historyMessages
        }
      }
    )

    this.#onGoingSubTopic += 1
  }

  concludeTopic = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    const historyMessages = [] as string[]
    this.#historyMessages().forEach((messages) =>
      historyMessages.push(...messages)
    )

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic: this.#subTopics[this.#onGoingSubTopic],
        participatorId: host.id as number,
        intent: seminarWorker.Intent.CONCLUDE,
        prompts: {
          topicMaterial: this.#topicMaterial,
          generateAudio: true,
          historyMessages
        }
      }
    )
  }

  stop = () => {
    seminarWorker.SeminarWorker.off(
      seminarWorker.SeminarEventType.CHAT_RESPONSE,
      this.onChatResponse as seminarWorker.ListenerFunc
    )
    seminarWorker.SeminarWorker.off(
      seminarWorker.SeminarEventType.ERROR,
      this.onError as seminarWorker.ListenerFunc
    )
  }

  nextGuests = async () => {
    this.#round += 1
    this.#subRound += 1

    const participators = await this.participators()
    const { id, topic } = this.#seminar

    const historyMessages =
      this.#historyMessages().get(this.#onGoingSubTopic) || []

    const guests = Math.ceil(Math.random() * participators.length)
    const speakers = [] as dbModel.Participator[]
    for (let i = 0; i < guests; i++) {
      speakers.push(
        participators[Math.floor(Math.random() * participators.length)]
      )
    }

    speakers.forEach((el) => {
      this.#onThinking(el.id as number)

      seminarWorker.SeminarWorker.send(
        seminarWorker.SeminarEventType.CHAT_REQUEST,
        {
          seminarId: id as number,
          subTopic: this.#subTopics[this.#onGoingSubTopic],
          participatorId: el.id as number,
          intent: seminarWorker.Intent.DISCUSS,
          prompts: {
            hostMessage: topic,
            generateAudio: true,
            historyMessages
          }
        }
      )
    })
  }

  hostRequest = () => {
    // TODO
  }

  userRequest = () => {
    // TODO
  }
}
