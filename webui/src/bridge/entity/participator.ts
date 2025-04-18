import { dbModel } from 'src/model'
import { _Simulator } from '../db'

export interface PSimulator {
  participatorId: number
  simulator: dbModel.Simulator
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
}
