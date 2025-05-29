import { dbSeminar } from '../../controller'
import { dbModel } from '../../model'

export class _Simulator {
  static initialize = async (simulators: dbModel.Simulator[]) => {
    for (let i  = 0; i < simulators.length; i++) {
      const _simulator = simulators[i]
      try {
        await dbSeminar.simulators.add(_simulator)
      } catch {
        try {
          await dbSeminar.simulators.update(_simulator, _simulator)
        } catch {
          // DO NOTHING
        }
      }
    }
  }

  static create = async (simulator: dbModel.Simulator) => {
    await dbSeminar.simulators.add(simulator)
  }

  static update = async (simulator: dbModel.Simulator) => {
    await dbSeminar.simulators.update(simulator, simulator)
  }

  static simulators = async (ids: number[]) => {
    return (await _Simulator.allSimulators()).filter((el) =>
      ids.includes(el.id)
    )
  }

  static allSimulators = async (): Promise<dbModel.Simulator[]> => {
    return (await dbSeminar.simulators.toArray()).filter((el) => el.state === 'APPROVED' && !el.disabled)
  }

  static randomPeek = async (host?: boolean) => {
    const simulators = (await _Simulator.allSimulators()).filter(
      (el: dbModel.Simulator) => host === undefined || !!el.host === host
    )
    const index = Math.floor(Math.random() * simulators.length)
    return simulators[index]
  }

  static simulator = async (id: number) => {
    return (await _Simulator.allSimulators()).find((el) => el.id === id)
  }

  static archetype = (simulator?: dbModel.Simulator) => {
    if (!simulator) return '朝阳区热心群众'
    return simulator.title + simulator.archetype
  }

  static archetypeWithId = async (simulatorId: number) => {
    const _simulator = (await _Simulator.allSimulators()).find(
      (el) => el.id === simulatorId
    )
    return _Simulator.archetype(_simulator)
  }
}
