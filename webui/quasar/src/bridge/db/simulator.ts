import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Simulator {
  static initialize = async (simulators: dbModel.Simulator[]) => {
    try {
      await dbSeminar.simulators.bulkPut(simulators)
    } catch {
      // Ignore if exists
    }
  }

  static create = async (
    name: string,
    avatar: string,
    personality: string,
    host: boolean,
    speakerVoice: string,
    archetype: string,
    title: string
  ) => {
    await dbSeminar.simulators.add({
      name,
      avatar,
      personality,
      host,
      speakerVoice,
      archetype,
      title
    })
  }

  static simulators = async (ids: number[]) => {
    return await dbSeminar.simulators.where('id').anyOf(ids).toArray()
  }

  static randomPeek = async (host?: boolean) => {
    const simulators = await dbSeminar.simulators
      .filter((op) => host === undefined || op.host === host)
      .toArray()
    const index = Math.floor(Math.random() * simulators.length)
    return simulators[index]
  }

  static simulator = async (id: number) => {
    return await dbSeminar.simulators.filter((op) => op.id === id).first()
  }

  static archetype = (simulator?: dbModel.Simulator) => {
    if (!simulator) return '朝阳区热心群众'
    return simulator?.title + simulator?.archetype
  }

  static archetypeWithId = async (simulatorId: number) => {
    const simulator = await dbSeminar.simulators
      .where('id')
      .equals(simulatorId)
      .first()
    return _Simulator.archetype(simulator)
  }
}
