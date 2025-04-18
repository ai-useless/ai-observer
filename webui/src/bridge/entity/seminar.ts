import { dbModel } from 'src/model'
import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'

type MessageFunc = (participatorId: number, message: string, round: number) => void | Promise<void>
type ThinkingFunc = (participatorId: number) => void
type OutlineFunc = (json: Record<string, unknown>) => void

export class ESeminar {
  #seminar = undefined as unknown as dbModel.Seminar
  #onMessage = undefined as unknown as MessageFunc
  #onThinking = undefined as unknown as ThinkingFunc
  #onOutline = undefined as unknown as OutlineFunc
  #round = 0

  constructor(seminar: dbModel.Seminar, onMessage: MessageFunc, onThinking: ThinkingFunc, onOutline: OutlineFunc) {
    this.#seminar = seminar
    this.#onMessage = onMessage
    this.#onThinking = onThinking
    this.#onOutline = onOutline
  }

  participators = async () => {
    return await dbBridge._Participator.participators(this.#seminar.uid)
  }

  host = async () => {
    return (await this.participators()).find((el) => el.role === dbModel.Role.HOST)
  }

  onChatResponse = (message: seminarWorker.ChatResponsePayload) => {
    if (message.seminarId !== this.#seminar.id) return
    void this.#onMessage(message.participatorId, message.payload.text, this.#round)

    if (!this.#round) this.#onOutline(message.payload.json)
  }

  start = async () => {
    const { id } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    seminarWorker.SeminarWorker.on(seminarWorker.SeminarEventType.CHAT_RESPONSE, this.onChatResponse)

    seminarWorker.SeminarWorker.send(seminarWorker.SeminarEventType.CHAT_REQUEST, {
      seminarId: id as number,
      participatorId: host.id as number,
      intent: seminarWorker.Intent.OUTLINE,
      prompts: {
        rounds: 5
      }
    })
  }

  stop = () => {
    seminarWorker.SeminarWorker.off(seminarWorker.SeminarEventType.CHAT_RESPONSE, this.onChatResponse)
  }

  nextGuests = async () => {
    this.#round += 1

    const participators = await this.participators()
    const { id, topic } = this.#seminar

    participators.forEach((el) => {
      this.#onThinking(el.id as number)

      seminarWorker.SeminarWorker.send(seminarWorker.SeminarEventType.CHAT_REQUEST, {
        seminarId: id as number,
        participatorId: el.id as number,
        intent: seminarWorker.Intent.DISCUSS,
        prompts: {
          subTopic: topic,
          hostMessage: topic
        }
      })
    })
  }

  hostRequest = () => {
    // TODO
  }

  userRequest = () => {
    // TODO
  }
}
