import { dbModel } from 'src/model'
import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'

type MessageFunc = (
  participatorId: number,
  message: string,
  round: number
) => void | Promise<void>
type ThinkingFunc = (participatorId: number) => void
type OutlineFunc = (json: Record<string, unknown>) => void

export class ESeminar {
  #seminar = undefined as unknown as dbModel.Seminar
  #onMessage = undefined as unknown as MessageFunc
  #onThinking = undefined as unknown as ThinkingFunc
  #onOutline = undefined as unknown as OutlineFunc

  #round = 0
  #onGoingSubTopic = 0
  #subRound = 0
  #topicMaterial = undefined as unknown as string
  #subTopics = [] as string[]

  #totalRounds = 5

  constructor(
    seminar: dbModel.Seminar,
    onMessage: MessageFunc,
    onThinking: ThinkingFunc,
    onOutline: OutlineFunc
  ) {
    this.#seminar = seminar
    this.#onMessage = onMessage
    this.#onThinking = onThinking
    this.#onOutline = onOutline
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

    if (this.#round === 1) this.#round += 1

    void this.#onMessage(
      message.participatorId,
      message.payload.text,
      this.#round
    )

    // Outline round
    if (this.#round === 0) {
      this.#onOutline(message.payload.json)
      this.#topicMaterial = message.payload.text
      this.#subTopics = message.payload.json.titles as string[]
      void this.startTopic()
      this.#round += 1
    }
    // Start topic round
    if (this.#subRound === 0) void this.startNextSubTopic()
    if (this.#subRound === 5) {
      void this.concludeSubTopic()
      if (this.#onGoingSubTopic === this.#subTopics.length - 1)
        void this.concludeTopic()
    }
  }

  shouldNext = () => {
    // User can only speak after round 2
    return this.#round > 1
  }

  start = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    seminarWorker.SeminarWorker.on(
      seminarWorker.SeminarEventType.CHAT_RESPONSE,
      this.onChatResponse
    )

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        participatorId: host.id as number,
        intent: seminarWorker.Intent.OUTLINE,
        prompts: {
          rounds: this.#totalRounds
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
        participatorId: host.id as number,
        intent: seminarWorker.Intent.START_TOPIC,
        prompts: {
          topicMaterial: this.#topicMaterial
        }
      }
    )
  }

  startNextSubTopic = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        participatorId: host.id as number,
        intent: seminarWorker.Intent.START_SUBTOPIC,
        prompts: {
          topicMaterial: this.#topicMaterial,
          subTopic: this.#subTopics[this.#onGoingSubTopic]
        }
      }
    )
  }

  concludeSubTopic = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    this.#subRound = 0

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        participatorId: host.id as number,
        intent: seminarWorker.Intent.CONCLUDE_SUBTOPIC,
        prompts: {
          subTopic: this.#subTopics[this.#onGoingSubTopic]
        }
      }
    )

    this.#onGoingSubTopic += 1
  }

  concludeTopic = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        participatorId: host.id as number,
        intent: seminarWorker.Intent.CONCLUDE,
        prompts: {
          topicMaterial: this.#topicMaterial
        }
      }
    )
  }

  stop = () => {
    seminarWorker.SeminarWorker.off(
      seminarWorker.SeminarEventType.CHAT_RESPONSE,
      this.onChatResponse
    )
  }

  nextGuests = async () => {
    this.#round += 1
    this.#subRound += 1

    const participators = await this.participators()
    const { id, topic } = this.#seminar

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
          participatorId: el.id as number,
          intent: seminarWorker.Intent.DISCUSS,
          prompts: {
            subTopic: topic,
            hostMessage: topic
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
