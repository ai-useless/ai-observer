import axios from 'taro-axios'
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
  prompt: string
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
  static speakerVoice = async (simulatorId: number) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return simulator.audio_id
  }

  static prompt = (
    prompt: string
  ) => {
    return Prompt.prompt(
      Intent.GENERATE,
      prompt
    )
  }

  static requestGenerate = async (
    prompt: string,
    modelId?: number
  ) => {
    const model = dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = RefineRunner.prompt(
      prompt
    )

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
    const {
      prompt,
      modelId
    } = payload

    const response = await RefineRunner.requestGenerate(
      prompt,
      modelId
    )
    if (!response || !response.text || !response.text.length) return

    return {
      modelId,
      ...response
    }
  }
}
