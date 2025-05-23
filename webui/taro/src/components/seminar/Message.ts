import { model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { Message as MessageBase } from 'src/typing'


export interface Message extends MessageBase {
  round: number
  participator: dbModel.Participator
  simulator: simulator._Simulator
  model: model._Model
  subTopicTitle: boolean
  subTopic: string
}
