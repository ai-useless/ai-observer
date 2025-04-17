import { dbModel } from 'src/model'
import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'

type MessageFunc = (participatorId: number, message: string) => void | Promise<void>

export class ESeminar {
  #seminar = undefined as unknown as dbModel.Seminar
  #onMessage = undefined as unknown as MessageFunc

  constructor(seminar: dbModel.Seminar, onMessage: MessageFunc) {
    this.#seminar = seminar
    this.#onMessage = onMessage
  }

  participators = async () => {
    return await dbBridge._Participator.participators(this.#seminar.uid)
  }

  host = async () => {
    return (await this.participators()).find((el) => el.role === dbModel.Role.HOST)
  }

  onChatResponse = (message: seminarWorker.ChatResponsePayload) => {
    if (message.seminarId !== this.#seminar.id) return
    void this.#onMessage(message.participatorId, message.payload)

    void this.nextGuests()
  }

  start = async () => {
    const { id, topic } = this.#seminar
    const host = await this.host()

    if (!host) throw new Error('Invalid host')

    seminarWorker.SeminarWorker.on(seminarWorker.SeminarEventType.CHAT_RESPONSE, this.onChatResponse)

    seminarWorker.SeminarWorker.send(seminarWorker.SeminarEventType.CHAT_REQUEST, {
      seminarId: id as number,
      participatorId: host.id as number,
      prompts: [topic]
    })
  }

  stop = () => {
    seminarWorker.SeminarWorker.off(seminarWorker.SeminarEventType.CHAT_RESPONSE, this.onChatResponse)
  }

  nextGuests = async () => {
    const participators = await this.participators()
    const { id, topic } = this.#seminar

    participators.forEach((el) => {
      seminarWorker.SeminarWorker.send(seminarWorker.SeminarEventType.CHAT_REQUEST, {
        seminarId: id as number,
        participatorId: el.id as number,
        prompts: [topic]
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
