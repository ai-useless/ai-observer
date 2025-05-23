import { model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { Message as MessageBase } from 'src/typing'

export interface Message extends MessageBase {
  topic: string
  participator: dbModel.Participator
  simulator: simulator._Simulator
  model: model._Model
  datetime: string
  timestamp: number
  first: boolean
  last: boolean
  typing: boolean
}
