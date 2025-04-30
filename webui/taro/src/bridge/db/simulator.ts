import { simulator } from 'src/localstores'

export class _Simulator {
  static simulators = (ids: number[]) => {
    return simulator.Simulator.allSimulators().filter((el) =>
      ids.includes(el.id as number)
    )
  }

  static randomPeek = (host?: boolean) => {
    const simulators = simulator.Simulator.allSimulators().filter(
      (el) => !host || el.host === host
    )
    const index = Math.floor(Math.random() * simulators.length)
    return simulators[index]
  }

  static simulator = (id: number) => {
    return simulator.Simulator.allSimulators().find((el) => el.id === id)
  }

  static archetype = (simulator?: simulator._Simulator) => {
    if (!simulator) return '朝阳区热心群众'
    return simulator.title + simulator.archetype
  }

  static archetypeWithId = (simulatorId: number) => {
    const _simulator = simulator.Simulator.allSimulators().find(
      (el) => el.id === simulatorId
    )
    return _Simulator.archetype(_simulator)
  }
}
