import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Participator {
  static create = async (seminarId: number, role: dbModel.Role, simulatorId: number, modelId: number) => {
    await dbSeminar.participators.add({
      seminarId,
      role,
      simulatorId,
      modelId
    })
  }

  static participators = async (seminarId: number) => {
    return await dbSeminar.participators.where('seminarId').equals(seminarId).toArray()
  }
}
