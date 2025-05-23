import axios from 'axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { purify } from 'src/utils'

export enum ChatEventType {
  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  ERROR = 'Error'
}

export interface GenerateRequestPayload {
  simulator: string
  personality: string
  myName: string
  historyMessages?: string[]
  modelId: number
  language: string
}

export interface GenerateResponsePayload {
  modelId: number
  text: string
}

export interface ChatEvent {
  type: ChatEventType
  payload: GenerateRequestPayload | GenerateResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: ChatEventType
  payload: GenerateRequestPayload
}

export class ChatRunner {
  static prompt = (
    simulator: string,
    personality: string,
    myName: string,
    historyMessages?: string[],
    language?: string
  ) => {
    return Prompt.prompt(
      Intent.GENERATE,
      simulator,
      personality,
      myName,
      historyMessages || [],
      language || '中文'
    )
  }

  static requestGenerate = async (
    simulator: string,
    personality: string,
    myName: string,
    language: string,
    historyMessages?: string[],
    modelId?: number
  ) => {
    const model = await dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = ChatRunner.prompt(
      simulator,
      personality,
      myName,
      historyMessages,
      language
    )

    const textResp = await axios.post(constants.FALLBACK_API, {
      model: model.name,
      messages: (historyMessages || []).map((el) => {
        return {
          role: 'user',
          content: purify.purifyText(el)
        }
      }),
      prompt: purify.purifyText(_prompt || '')
    })
    if (!(textResp.data as Record<string, string>).content) {
      return {
        text: undefined
      }
    }

    return {
      text: (textResp.data as Record<string, string>).content
    }
  }

  static handleGenerateRequest = async (
    payload: GenerateRequestPayload
  ): Promise<GenerateResponsePayload | undefined> => {
    const {
      historyMessages,
      modelId,
      simulator,
      personality,
      myName,
      language
    } = payload

    const response = await ChatRunner.requestGenerate(
      simulator,
      personality,
      myName,
      language,
      historyMessages,
      modelId
    )
    if (!response || !response.text || !response.text.length) return

    return {
      modelId,
      ...response
    }
  }
}
