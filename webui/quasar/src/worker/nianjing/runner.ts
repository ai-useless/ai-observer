import axios from 'axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { purify } from 'src/utils'

export enum NianJingEventType {
  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  ERROR = 'Error'
}

export interface GenerateRequestPayload {
  name: string
  modelId: number
}

export interface GenerateResponsePayload {
  modelId: number
  text: string
  texts: string[]
}

export interface NianJingEvent {
  type: NianJingEventType
  payload: GenerateRequestPayload | GenerateResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: NianJingEventType
  payload: GenerateRequestPayload
}

export class NianJingRunner {
  static prompt = (name: string) => {
    return Prompt.prompt(Intent.GENERATE, name)
  }

  static requestGenerate = async (name: string, modelId?: number) => {
    const model = await dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = NianJingRunner.prompt(name)

    const textResp = await axios.post(constants.FALLBACK_API, {
      model: model.name,
      messages: [],
      prompt: purify.purifyText(_prompt || '')
    })
    if (!(textResp.data as Record<string, string>).content) {
      return {
        text: undefined as unknown as string,
        texts: []
      }
    }

    const content = (textResp.data as Record<string, string>).content
    const texts = Prompt.postProcess(content)
    return {
      text: content,
      texts: texts
    }
  }

  static handleGenerateRequest = async (
    payload: GenerateRequestPayload
  ): Promise<GenerateResponsePayload | undefined> => {
    const { name, modelId } = payload

    const response = await NianJingRunner.requestGenerate(name, modelId)
    if (!response || !response.texts || !response.texts.length) return

    return {
      modelId,
      ...response
    }
  }
}
