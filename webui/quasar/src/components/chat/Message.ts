import { Message as MessageBase } from 'src/typing'

export interface Message extends MessageBase {
  send: boolean
  displayName: string
  avatar: string
  hint: boolean
}
