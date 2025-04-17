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
  prompts: string[]
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

  static requestParticipatorChat = async (participatorId: number, prompts: string[]) => {
    const participator = await dbBridge._Participator.participator(participatorId)
    if (!participator) return

    const model = await dbBridge._Model.model(participator.modelId)
    if (!model) return

    const resp = await axios.post(model.endpoint || constants.FALLBACK_API, {
      ai: 'AI1',
      messages: prompts.map((el) => {
        return {
          role: 'user',
          content: el
        }
      })
    })
    return (resp.data as Record<string, string>).content
  }

  static handleChatRequest = async (payload: ChatRequestPayload) => {
    const { seminarId, participatorId, prompts } = payload

    try {
      const response = await SeminarRunner.requestParticipatorChat(participatorId, prompts)
      if (!response) return

      await SeminarRunner.bulkStoreResponse(seminarId, participatorId, prompts[prompts.length - 1], response)

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
