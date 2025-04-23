import { dbModel } from '../../model'

export class _Participator {
  static #participators = [] as dbModel.Participator[]

  static create = (
    seminarUid: string,
    role: dbModel.Role,
    simulatorId: number,
    modelId: number
  ) => {
    _Participator.#participators.push({
      id: _Participator.#participators.length,
      seminarUid,
      role,
      simulatorId,
      modelId
    })
  }

  static participators = (seminarUid: string) => {
    return _Participator.#participators.filter((el) => el.seminarUid === seminarUid)
  }

  static guests = (seminarUid: string) => {
    return _Participator.participators(seminarUid).filter((el) => el.role = dbModel.Role.GUEST)
  }

  static host = (seminarUid: string) => {
    return _Participator.participators(seminarUid).find((el) => el.role = dbModel.Role.HOST)
  }

  static createParticipators = async (
    participators: dbModel.Participator[]
  ) => {
    participators.forEach((participator) => {
      participator.id = _Participator.#participators.length
      _Participator.#participators.push(participator)
    })
  }

  static participator = (id: number) => {
    return _Participator.#participators[id]
  }
}
