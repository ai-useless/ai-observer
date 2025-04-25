import { dbModel } from 'src/model'

export interface Message {
  round: number
  message: string
  participator: dbModel.Participator
  simulator: dbModel.Simulator
  model: dbModel.Model
  datetime: string
  timestamp: number
  audio: string
  subTopicTitle: boolean
  subTopic: string
}
