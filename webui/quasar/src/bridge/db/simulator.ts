import { _Simulator as __Simulator } from 'src/localstores/simulator/types'

export class _Simulator {
  private static _simulators = [] as __Simulator[]

  static initialize = (simulators: __Simulator[]) => {
    _Simulator._simulators = simulators
  }

  static simulators = (ids: number[]) => {
    return _Simulator._simulators.filter((el) =>
      ids.includes(el.id)
    )
  }

  static randomPeek = (host?: boolean) => {
    const simulators = _Simulator._simulators.filter(
      (el) => !host || el.host === host
    )
    const index = Math.floor(Math.random() * simulators.length)
    return simulators[index]
  }

  static simulator = (id: number) => {
    return _Simulator._simulators.find((el) => el.id === id)
  }

  static archetype = (simulator?: __Simulator) => {
    if (!simulator) return '朝阳区热心群众'
    return simulator.title + simulator.archetype
  }

  static archetypeWithId = (simulatorId: number) => {
    const _simulator = _Simulator._simulators.find(
      (el) => el.id === simulatorId
    )
    return _Simulator.archetype(_simulator)
  }
}
