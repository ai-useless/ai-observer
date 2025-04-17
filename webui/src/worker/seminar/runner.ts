import { SendMessage } from '../../localstores/seminar'
import axios from 'axios'
import { constants } from 'src/constant'
import { dbBridge } from 'src/bridge'

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
  static bulkStoreResponse = async (
    seminarId: number,
    participatorId: number,
    prompt: string,
    response: string
  ) => {
    await dbBridge._Message.create(
      seminarId,
      participatorId,
      prompt,
      response
    )
  }

  static handleChatRequest = async (payload: ChatRequestPayload) => {
    const { seminarId, participatorId, prompts } = payload
    console.log('seminarId: ', seminarId)
    console.log('participatorId: ', participatorId)
    console.log('prompts: ', prompts)
    try {
      const res = await axios.post(constants.AI_CHAT_HTTP_URL, {
        ai: 'AI1',
        messages: prompts
      })

      const response = res.data as SendMessage

      SeminarRunner.bulkStoreResponse(seminarId, participatorId, prompts[prompts.length-1].content, response.content)

      self.postMessage({
        type: SeminarEventType.CHAT_RESPONSE,
        payload: {
          seminarId,
          participatorId,
          response
        }
      })
    } catch (e) {
      self.postMessage({
        type: SeminarEventType.Error,
        payload: e
      })
    }
    console.log(payload)
  }
}
