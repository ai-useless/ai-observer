export enum SeminarEventType {
  CHAT_REQUEST = 'ChatRequest',
  CHAT_RESPONSE = 'ChatResponse',

  Error = 'Error'
}

export interface ChatRequestPayload {
  seminarId: number
  participatorId: number
  prompts: SendMessage[]
}

export type ChatResponsePayload = {
  seminarId: number
  participatorId: number
  response: string
}

export interface SeminarEvent {
  type: SeminarEventType
  payload:
    | ChatRequestPayload
    | ChatResponsePayload
}

export class SeminarRunner {
  static handleChatRequest = async (payload: ChatRequestPayload) => {
    console.log(payload)
  }
}
