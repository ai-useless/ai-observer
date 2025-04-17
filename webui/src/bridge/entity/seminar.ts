import { dbModel } from 'src/model'
import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'

export class ESeminar {
  #seminar = undefined as unknown as dbModel.Seminar

  constructor(seminar: dbModel.Seminar) {
    this.#seminar = seminar
  }

  participators = async () => {
    return await dbBridge._Participator.participators(this.#seminar.uid)
  }

  host = async () => {
    return (await this.participators()).find((el) => el.role === dbModel.Role.HOST)
  }

  start = async () => {
    const { id, topic } = this.#seminar
    const host = await this.host()

    if (!host) return

    seminarWorker.SeminarWorker.send(seminarWorker.SeminarEventType.CHAT_REQUEST, {
      seminarId: id as number,
      participatorId: host.id as number,
      prompts: [topic]
    })
  }
}
