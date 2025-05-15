import axios from 'taro-axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { purify } from 'src/utils'

export enum DuanziEventType {
  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  ERROR = 'Error'
}

export interface GenerateRequestPayload {
  historyMessages?: string[]
  modelId: number
}

export interface GenerateResponsePayload {
  modelId: number
  texts: string[]
}

export interface DuanziEvent {
  type: DuanziEventType
  payload: GenerateRequestPayload | GenerateResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: DuanziEventType
  payload: GenerateRequestPayload
}

export class DuanziRunner {
  static speakerVoice = async (simulatorId: number) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return simulator.audio_id
  }

  static prompt = (historyMessages?: string[]) => {
    return Prompt.prompt(Intent.GENERATE, historyMessages || [])
  }

  static requestGenerate = async (
    historyMessages?: string[],
    modelId?: number
  ) => {
    const model = dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = DuanziRunner.prompt(historyMessages)

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
        texts: []
      }
    }

    const texts = Prompt.postProcess(purify.purifyText((textResp.data as Record<string, string>).content))
    return {
      texts
    }
  }

  static handleGenerateRequest = async (
    payload: GenerateRequestPayload
  ): Promise<GenerateResponsePayload | undefined> => {
    const { historyMessages, modelId } = payload

    const response = await DuanziRunner.requestGenerate(
      historyMessages,
      modelId
    )
    if (!response || !response.texts || !response.texts.length) return

    return {
      modelId,
      ...response
    }
  }
}
