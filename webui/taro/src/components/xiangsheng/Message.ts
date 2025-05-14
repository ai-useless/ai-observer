import { model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'

export interface Message {
  message: string
  participator: dbModel.Participator
  simulator: simulator._Simulator
  model: model._Model
  datetime: string
  timestamp: number
  audio: string
  index: number
}
