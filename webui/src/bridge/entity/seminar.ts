import { dbModel } from 'src/model'
import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'
import { EParticipator, PSimulator } from './participator'

type MessageFunc = (
  subTopic: string,
  participatorId: number,
  message: string,
  round: number,
  audio: string
) => void | Promise<void>
type ThinkingFunc = (participatorId: number) => void
type OutlineFunc = (json: Record<string, unknown>) => void
type HistoryMessagesFunc = () => Map<string, string[]>

export class ESeminar {
  #seminar = undefined as unknown as dbModel.Seminar
  #onMessage = undefined as unknown as MessageFunc
  #onThinking = undefined as unknown as ThinkingFunc
  #onOutline = undefined as unknown as OutlineFunc
  #historyMessages = undefined as unknown as HistoryMessagesFunc

  #topicMaterial = undefined as unknown as string
  #subTopics = [] as string[]
  #concludedSubTopics = new Map<string, boolean>()

  #totalTopics = 6
  #subRound = 0
  // At least 2 for sub topic start
  #subRounds = 7
  #round = 0
  #canNext = false
  #lastRoundIsHost = false

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
    return await EParticipator.simulators(
      await dbBridge._Participator.participators(this.#seminar.uid)
    )
  }

  host = async () => {
    return await EParticipator.host(this.#seminar.uid)
  }

  onChatResponse = (message: seminarWorker.ChatResponsePayload) => {
    if (message.seminarId !== this.#seminar.id) return

    const { intent, subTopic, participatorId, payload, round, subRound } =
      message

    // Outline round
    if (intent === seminarWorker.Intent.OUTLINE) {
      this.#onOutline(message.payload.json)
      this.#topicMaterial = message.payload.text
      this.#subTopics = message.payload.json.titles as string[]
      void this.startTopic()
    }
    // Start topic round
    if (
      intent === seminarWorker.Intent.START_TOPIC ||
      intent === seminarWorker.Intent.CONCLUDE_SUBTOPIC
    ) {
      if (this.#subTopics[this.#subTopics.length - 1] === subTopic) {
        if (intent === seminarWorker.Intent.CONCLUDE_SUBTOPIC) {
          this.#canNext = false
          void this.concludeTopic()
        }
      } else {
        this.#canNext = false
        this.#lastRoundIsHost = true
        void this.startNextSubTopic(subTopic)
        this.#subRound += 1
      }
    }
    if (
      intent === seminarWorker.Intent.START_FIRST_SUBTOPIC ||
      intent === seminarWorker.Intent.START_SUBTOPIC
    ) {
      this.#canNext = true
    }
    if (
      subRound >= this.#subRounds &&
      intent === seminarWorker.Intent.DISCUSS
    ) {
      if (!this.#concludedSubTopics.get(subTopic)) {
        this.#canNext = false
        this.#concludedSubTopics.set(subTopic, true)
        void this.concludeSubTopic(subTopic)
      }
    }

    void this.#onMessage(
      subTopic,
      participatorId,
      payload.text,
      round,
      payload.audio
    )
  }

  onError = (error: seminarWorker.ErrorResponsePayload) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed request [${error.payload.intent}}]: ${error.error}`)
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
        participatorId: host.participatorId as number,
        intent: seminarWorker.Intent.OUTLINE,
        round: this.#round,
        subRound: this.#subRound,
        prompts: {
          archetype: await dbBridge._Simulator.archetypeWithId(
            host.simulator?.id as number
          ),
          rounds: this.#totalTopics
        }
      }
    )

    this.#onThinking(host.participatorId as number)
  }

  startTopic = async () => {
    const { id, uid } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    const participators = await dbBridge._Participator.guests(uid)
    const simulators = await EParticipator.simulators(participators)

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic: undefined as unknown as string,
        participatorId: host.participatorId as number,
        intent: seminarWorker.Intent.START_TOPIC,
        round: this.#round,
        subRound: this.#subRound,
        prompts: {
          topicMaterial: this.#topicMaterial,
          generateAudio: true,
          guests: simulators.map(
            (el) => el.simulator.name + ', ' + el.simulator.personality
          ),
          archetype: await dbBridge._Simulator.archetypeWithId(
            host.simulator?.id as number
          )
        }
      }
    )

    this.#onThinking(host.participatorId as number)
  }

  startNextSubTopic = async (prevSubTopic?: string) => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')
    if (!this.#subTopics.length) return

    let index = 0
    if (prevSubTopic?.length) {
      // Here we're not the first topic so we goto next one
      index = this.#subTopics.findIndex(
        (el) => !prevSubTopic || el === prevSubTopic
      )
      if (index < 0 || index >= this.#subTopics.length - 1) return
      index += 1
    }

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic: this.#subTopics[index],
        participatorId: host.participatorId as number,
        intent:
          index === 0
            ? seminarWorker.Intent.START_FIRST_SUBTOPIC
            : seminarWorker.Intent.START_SUBTOPIC,
        round: this.#round,
        subRound: this.#subRound,
        prompts: {
          topicMaterial: this.#topicMaterial,
          generateAudio: true,
          archetype: await dbBridge._Simulator.archetypeWithId(
            host.simulator?.id as number
          )
        }
      }
    )

    this.#onThinking(host.participatorId as number)
  }

  concludeSubTopic = async (subTopic: string) => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    this.#subRound = 0

    const historyMessages = this.#historyMessages().get(subTopic) || []

    seminarWorker.SeminarWorker.send(
      seminarWorker.SeminarEventType.CHAT_REQUEST,
      {
        seminarId: id as number,
        subTopic,
        participatorId: host.participatorId as number,
        intent: seminarWorker.Intent.CONCLUDE_SUBTOPIC,
        round: this.#round,
        subRound: this.#subRound,
        prompts: {
          topicMaterial: this.#topicMaterial,
          generateAudio: true,
          historyMessages,
          archetype: await dbBridge._Simulator.archetypeWithId(
            host.simulator?.id as number
          )
        }
      }
    )
    this.#onThinking(host.participatorId as number)
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
        subTopic: this.#subTopics[this.#subTopics.length - 1],
        participatorId: host.participatorId as number,
        intent: seminarWorker.Intent.CONCLUDE,
        round: this.#round,
        subRound: this.#subRound,
        prompts: {
          topicMaterial: this.#topicMaterial,
          generateAudio: true,
          historyMessages,
          archetype: await dbBridge._Simulator.archetypeWithId(
            host.simulator?.id as number
          )
        }
      }
    )
    this.#onThinking(host.participatorId as number)
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

  nextGuests = async (subTopic: string) => {
    const participators = await this.participators()
    const { id, topic } = this.#seminar

    const historyMessages = this.#historyMessages().get(subTopic) || []

    const guests = Math.max(Math.ceil(Math.random() * participators.length), 2)
    let speakers = [] as PSimulator[]

    for (let i = 0; i < guests; i++) {
      let participator = undefined as unknown as PSimulator
      do {
        participator =
          participators[Math.floor(Math.random() * participators.length)]
      } while (
        speakers.findIndex(
          (el) => el.participatorId === participator.participatorId
        ) >= 0
      )
      speakers.push(participator)
    }

    // If we have host in speaker, run host challenge and skip this round
    const host = speakers.find((el) => el.isHost)
    if (host && !this.#lastRoundIsHost) {
      this.#onThinking(host.participatorId)
      this.#lastRoundIsHost = true

      seminarWorker.SeminarWorker.send(
        seminarWorker.SeminarEventType.CHAT_REQUEST,
        {
          seminarId: id as number,
          subTopic,
          participatorId: host.participatorId,
          intent: seminarWorker.Intent.HOST_CHALLENGE,
          round: this.#round,
          subRound: this.#subRound,
          prompts: {
            topicMaterial: this.#topicMaterial,
            generateAudio: true,
            historyMessages,
            archetype: await dbBridge._Simulator.archetypeWithId(
              host.simulator?.id as number
            )
          }
        }
      )

      return
    }

    speakers = speakers.filter((el) => !el.isHost)

    this.#round += 1
    this.#subRound += 1
    this.#lastRoundIsHost = false

    speakers.forEach((el) => {
      this.#onThinking(el.participatorId)

      seminarWorker.SeminarWorker.send(
        seminarWorker.SeminarEventType.CHAT_REQUEST,
        {
          seminarId: id as number,
          subTopic,
          participatorId: el.participatorId,
          intent: seminarWorker.Intent.DISCUSS,
          round: this.#round,
          subRound: this.#subRound,
          prompts: {
            hostMessage: topic,
            generateAudio: true,
            historyMessages,
            archetype: dbBridge._Simulator.archetype(el.simulator)
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
