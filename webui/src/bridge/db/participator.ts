import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Participator {
  static create = async (
    seminarUid: string,
    role: dbModel.Role,
    simulatorId: number,
    modelId: number
  ) => {
    await dbSeminar.participators.add({
      seminarUid,
      role,
      simulatorId,
      modelId
    })
  }

  static participators = async (seminarUid: string) => {
    return await dbSeminar.participators
      .where('seminarUid')
      .equals(seminarUid)
      .toArray()
  }

  static guests = async (seminarUid: string) => {
    return (await _Participator.participators(seminarUid)).filter(
      (el) => el.role === dbModel.Role.GUEST
    )
  }

  static createParticipators = async (
    participators: dbModel.Participator[]
  ) => {
    await dbSeminar.participators.bulkAdd(participators)
  }

  static participator = async (id: number) => {
    return await dbSeminar.participators.get({ id: id })
  }
}
