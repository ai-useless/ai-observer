import { Message as MessageBase } from 'src/typing'

export interface Message extends MessageBase {
  title: string
  modelId: number
  messageUid: string
  image?: string
}
