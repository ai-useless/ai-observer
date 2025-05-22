import axios from 'axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { purify } from 'src/utils'

export enum RefineEventType {
  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  ERROR = 'Error'
}

export interface GenerateRequestPayload {
  intent: Intent
  prompt: string
  style: string
  letters: number
  modelId: number
}

export interface GenerateResponsePayload {
  modelId: number
  text: string
}

export interface RefineEvent {
  type: RefineEventType
  payload: GenerateRequestPayload | GenerateResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: RefineEventType
  payload: GenerateRequestPayload
}

export class RefineRunner {
  static prompt = (
    intent: Intent,
    prompt: string,
    style: string,
    letters: number
  ) => {
    return Prompt.prompt(intent, prompt, style, letters)
  }

  static requestGenerate = async (
    intent: Intent,
    prompt: string,
    style: string,
    letters: number,
    modelId?: number
  ) => {
    const model = await dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = RefineRunner.prompt(intent, prompt, style, letters)

    const textResp = await axios.post(constants.FALLBACK_API, {
      model: model.name,
      messages: [],
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
    const { intent, prompt, style, letters, modelId } = payload

    const response = await RefineRunner.requestGenerate(
      intent,
      prompt,
      style,
      letters,
      modelId
    )
    if (!response || !response.text || !response.text.length) return

    return {
      modelId,
      ...response
    }
  }
}
