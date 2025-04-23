import { dbModel } from '../../model'

export class _Participator {
  private static _participators = [] as dbModel.Participator[]

  static create = (
    seminarUid: string,
    role: dbModel.Role,
    simulatorId: number,
    modelId: number
  ) => {
    _Participator._participators.push({
      id: _Participator.participators.length,
      seminarUid,
      role,
      simulatorId,
      modelId
    })
  }

  static participators = (seminarUid: string) => {
    return _Participator._participators.filter(
      (el) => el.seminarUid === seminarUid
    )
  }

  static guests = (seminarUid: string) => {
    return _Participator
      .participators(seminarUid)
      .filter((el) => (el.role = dbModel.Role.GUEST))
  }

  static host = (seminarUid: string) => {
    return _Participator
      .participators(seminarUid)
      .find((el) => (el.role = dbModel.Role.HOST))
  }

  static createParticipators = async (
    participators: dbModel.Participator[]
  ) => {
    participators.forEach((participator) => {
      participator.id = _Participator._participators.length
      _Participator._participators.push(participator)
    })
  }

  static participator = (id: number) => {
    return _Participator._participators[id]
  }
}
