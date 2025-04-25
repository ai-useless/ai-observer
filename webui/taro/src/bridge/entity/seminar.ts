import { dbModel } from '../../model'
import { seminarWorker } from '../../worker'
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
  private seminar = undefined as unknown as dbModel.Seminar
  private onMessage = undefined as unknown as MessageFunc
  private onThinking = undefined as unknown as ThinkingFunc
  private onOutline = undefined as unknown as OutlineFunc
  private historyMessages = undefined as unknown as HistoryMessagesFunc

  private topicMaterial = undefined as unknown as string
  private subTopics = [] as string[]
  private concludedSubTopics = new Map<string, boolean>()

  private totalTopics = 6
  private subRound = 0
  // At least 2 for sub topic start
  private subRounds = 7
  private round = 0
  private canNext = false
  private lastRoundIsHost = false

  constructor(
    seminar: dbModel.Seminar,
    onMessage: MessageFunc,
    onThinking: ThinkingFunc,
    onOutline: OutlineFunc,
    historyMessages: HistoryMessagesFunc
  ) {
    this.seminar = seminar
    this.onMessage = onMessage
    this.onThinking = onThinking
    this.onOutline = onOutline
    this.historyMessages = historyMessages
  }

  participators = () => {
    return EParticipator.simulators(
      dbBridge._Participator.participators(this.seminar.uid)
    )
  }

  host = () => {
    return EParticipator.host(this.seminar.uid)
  }

  onChatResponse = (message: seminarWorker.ChatResponsePayload) => {
    if (message.seminarId !== this.seminar.id) return

    const { intent, subTopic, participatorId, payload, round, subRound } =
      message

    // Outline round
    if (intent === seminarWorker.Intent.OUTLINE) {
      this.onOutline(message.payload.json as Record<string, unknown>)
      this.topicMaterial = message.payload.text
      this.subTopics = (message.payload.json as Record<string, unknown>)
        .titles as string[]
      setTimeout(() => {
        void this.startTopic()
      }, 100)
    }
    // Start topic round
    if (
      intent === seminarWorker.Intent.START_TOPIC ||
      intent === seminarWorker.Intent.CONCLUDE_SUBTOPIC
    ) {
      if (this.subTopics[this.subTopics.length - 1] === subTopic) {
        if (intent === seminarWorker.Intent.CONCLUDE_SUBTOPIC) {
          this.canNext = false
          setTimeout(() => {
            void this.concludeTopic()
          }, 100)
        }
      } else {
        this.canNext = false
        this.lastRoundIsHost = true
        setTimeout(() => {
          void this.startNextSubTopic()
        }, 100)
        this.subRound += 1
      }
    }
    if (
      intent === seminarWorker.Intent.START_FIRST_SUBTOPIC ||
      intent === seminarWorker.Intent.START_SUBTOPIC
    ) {
      this.canNext = true
    }
    if (subRound >= this.subRounds && intent === seminarWorker.Intent.DISCUSS) {
      if (!this.concludedSubTopics.get(subTopic)) {
        this.canNext = false
        this.concludedSubTopics.set(subTopic, true)
        setTimeout(() => {
          void this.concludeSubTopic(subTopic)
        }, 100)
      }
    }

    void this.onMessage(
      subTopic,
      participatorId,
      payload.text,
      round,
      payload.audio
    )
  }

  shouldNext = () => {
    return this.canNext
  }

  start = async () => {
    const { id } = this.seminar
    const host = this.host()

    if (!host) throw new Error('Invalid host')

    this.onThinking(host.participatorId as number)
    const payload = await seminarWorker.SeminarRunner.handleChatRequest({
      seminarId: id as number,
      subTopic: undefined as unknown as string,
      participatorId: host.participatorId as number,
      intent: seminarWorker.Intent.OUTLINE,
      round: this.round,
      subRound: this.subRound,
      prompts: {
        archetype: dbBridge._Simulator.archetypeWithId(
          host.simulator.id as number
        ),
        rounds: this.totalTopics
      }
    })
    if (payload) this.onChatResponse(payload)
  }

  startTopic = async () => {
    const { id, uid } = this.seminar
    const host = this.host()

    if (!host) throw new Error('Invalid host')

    const participators = dbBridge._Participator.guests(uid)
    const simulators = EParticipator.simulators(participators)

    this.onThinking(host.participatorId as number)
    const payload = await seminarWorker.SeminarRunner.handleChatRequest({
      seminarId: id as number,
      subTopic: undefined as unknown as string,
      participatorId: host.participatorId as number,
      intent: seminarWorker.Intent.START_TOPIC,
      round: this.round,
      subRound: this.subRound,
      prompts: {
        topicMaterial: this.topicMaterial,
        generateAudio: true,
        guests: simulators.map(
          (el) => el.simulator.name + ', ' + el.simulator.personality
        ),
        archetype: dbBridge._Simulator.archetypeWithId(
          host.simulator.id as number
        )
      }
    })
    if (payload) this.onChatResponse(payload)
  }

  startNextSubTopic = async (prevSubTopic?: string) => {
    const { id } = this.seminar
    const host = this.host()

    if (!host) throw new Error('Invalid host')
    if (!this.subTopics.length) return

    let index = 0
    if (prevSubTopic && prevSubTopic.length) {
      // Here we're not the first topic so we goto next one
      index = this.subTopics.findIndex(
        (el) => !prevSubTopic || el === prevSubTopic
      )
      if (index < 0 || index >= this.subTopics.length - 1) return
      index += 1
    }

    this.onThinking(host.participatorId as number)
    const payload = await seminarWorker.SeminarRunner.handleChatRequest({
      seminarId: id as number,
      subTopic: this.subTopics[index],
      participatorId: host.participatorId as number,
      intent:
        index === 0
          ? seminarWorker.Intent.START_FIRST_SUBTOPIC
          : seminarWorker.Intent.START_SUBTOPIC,
      round: this.round,
      subRound: this.subRound,
      prompts: {
        topicMaterial: this.topicMaterial,
        generateAudio: true,
        archetype: dbBridge._Simulator.archetypeWithId(
          host.simulator.id as number
        )
      }
    })
    if (payload) this.onChatResponse(payload)
  }

  concludeSubTopic = async (subTopic: string) => {
    const { id } = this.seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    this.subRound = 0

    const historyMessages = this.historyMessages().get(subTopic) || []

    this.onThinking(host.participatorId as number)
    const payload = await seminarWorker.SeminarRunner.handleChatRequest({
      seminarId: id as number,
      subTopic,
      participatorId: host.participatorId as number,
      intent: seminarWorker.Intent.CONCLUDE_SUBTOPIC,
      round: this.round,
      subRound: this.subRound,
      prompts: {
        topicMaterial: this.topicMaterial,
        generateAudio: true,
        historyMessages,
        archetype: await dbBridge._Simulator.archetypeWithId(
          host.simulator.id as number
        )
      }
    })
    if (payload) this.onChatResponse(payload)
  }

  concludeTopic = async () => {
    const { id } = this.seminar
    const host = this.host()

    if (!host) throw new Error('Invalid host')

    const historyMessages = [] as string[]
    this.historyMessages().forEach((messages) =>
      historyMessages.push(...messages)
    )

    this.onThinking(host.participatorId as number)
    const payload = await seminarWorker.SeminarRunner.handleChatRequest({
      seminarId: id as number,
      subTopic: this.subTopics[this.subTopics.length - 1],
      participatorId: host.participatorId as number,
      intent: seminarWorker.Intent.CONCLUDE,
      round: this.round,
      subRound: this.subRound,
      prompts: {
        topicMaterial: this.topicMaterial,
        generateAudio: true,
        historyMessages,
        archetype: dbBridge._Simulator.archetypeWithId(
          host.simulator.id as number
        )
      }
    })
    if (payload) this.onChatResponse(payload)
  }

  stop = () => {}

  guestRequest = (subTopic: string, participatorId: number) => {
    const { id } = this.seminar
    const historyMessages = this.historyMessages().get(subTopic) || []

    const participator = dbBridge._Participator.participator(participatorId)
    const simulator = EParticipator.simulator(participator)

    seminarWorker.SeminarRunner.handleChatRequest({
      seminarId: id as number,
      subTopic,
      participatorId: participatorId,
      intent: seminarWorker.Intent.HOST_CHALLENGE,
      round: this.round,
      subRound: this.subRound,
      prompts: {
        topicMaterial: this.topicMaterial,
        generateAudio: true,
        historyMessages,
        archetype: dbBridge._Simulator.archetypeWithId(
          simulator.simulator.id as number
        )
      }
    }).then((payload) => {
      if (payload) this.onChatResponse(payload)
        else console.log('I really dont know what to say')
    }).catch((e) => {
      console.log(`Failed guest request: ${e}, retrying ...`)
      setTimeout(() => {
        this.guestRequest(subTopic, participatorId)
      }, 1000)
    })
  }

  nextGuests = async (subTopic: string) => {
    const participators = this.participators()

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
    if (host && !this.lastRoundIsHost) {
      this.onThinking(host.participatorId)
      this.lastRoundIsHost = true

      this.guestRequest(subTopic, host.participatorId)
      return
    }

    speakers = speakers.filter((el) => !el.isHost)

    this.round += 1
    this.subRound += 1
    this.lastRoundIsHost = false

    for (const speaker of speakers) {
      this.onThinking(speaker.participatorId)

      this.guestRequest(subTopic, speaker.participatorId)
    }
  }

  hostRequest = () => {
    // TODO
  }

  userRequest = () => {
    // TODO
  }
}
