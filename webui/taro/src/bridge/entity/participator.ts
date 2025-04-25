import { dbModel } from '../../model'
import { _Participator, _Simulator } from '../db'

export interface PSimulator {
  participatorId: number
  simulator: dbModel.Simulator
  isHost: boolean
}

export class EParticipator {
  static simulators = (participators: dbModel.Participator[]) => {
    const simulators = _Simulator.simulators(
      participators.map((el) => el.simulatorId)
    )
    return participators.map((el) => {
      return {
        participatorId: el.id,
        simulator: simulators.find((_el) => el.simulatorId === _el.id),
        isHost: el.role === dbModel.Role.HOST
      } as PSimulator
    })
  }

  static host = (seminarUid: string) => {
    const host = _Participator.host(seminarUid)
    if (!host) return
    return {
      participatorId: host.id,
      simulator: _Simulator.simulator(host.simulatorId as number),
      isHost: true
    }
  }

  static simulator = (participator: dbModel.Participator) => {
    const simulator = _Simulator.simulator(participator.simulatorId)
    return {
      participatorId: participator.id,
      simulator: simulator,
      isHost: participator.role === dbModel.Role.HOST
    } as PSimulator
  }
}
