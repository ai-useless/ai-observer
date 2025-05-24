import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Simulator {
  static initialize = async (simulators: dbModel.Simulator[]) => {
    try {
      await dbSeminar.simulators.bulkPut(simulators)
    } catch {
      // DO NOTHING
    }
  }

  static create = async (simulator: dbModel.Simulator) => {
    await dbSeminar.simulators.add(simulator)
  }

  static simulators = async (ids: number[]) => {
    return (await dbSeminar.simulators.toArray()).filter((el) =>
      ids.includes(el.id)
    )
  }

  static allSimulators = async () => {
    return await dbSeminar.simulators.toArray()
  }

  static randomPeek = async (host?: boolean) => {
    const simulators = (await dbSeminar.simulators.toArray()).filter(
      (el) => host === undefined || el.host === host
    )
    const index = Math.floor(Math.random() * simulators.length)
    return simulators[index]
  }

  static simulator = async (id: number) => {
    return (await dbSeminar.simulators.toArray()).find((el) => el.id === id)
  }

  static archetype = (simulator?: dbModel.Simulator) => {
    if (!simulator) return '朝阳区热心群众'
    return simulator.title + simulator.archetype
  }

  static archetypeWithId = async (simulatorId: number) => {
    const _simulator = (await dbSeminar.simulators.toArray()).find(
      (el) => el.id === simulatorId
    )
    return _Simulator.archetype(_simulator)
  }
}
