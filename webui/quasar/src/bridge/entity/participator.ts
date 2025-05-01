import { dbModel } from 'src/model'
import { _Participator, _Simulator } from '../db'
import { simulator } from 'src/localstores'

export interface PSimulator {
  participatorId: number
  simulator: simulator._Simulator
  isHost: boolean
}

export class EParticipator {
  static simulators = async (participators: dbModel.Participator[]) => {
    const simulators = await _Simulator.simulators(
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

  static host = async (seminarUid: string) => {
    const host = await _Participator.host(seminarUid)
    return {
      participatorId: host?.id,
      simulator: await _Simulator.simulator(host?.simulatorId as number),
      isHost: true
    }
  }
}
