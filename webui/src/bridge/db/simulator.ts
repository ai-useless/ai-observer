import { dbSeminar } from 'src/controller'

export class _Simulator {
  static create = async (name: string, avatar: string) => {
    await dbSeminar.simulators.add({
      name,
      avatar
    })
  }

  static simulators = async (ids: number[]) => {
    return await dbSeminar.simulators.where('id').anyOf(ids).toArray()
  }
}
