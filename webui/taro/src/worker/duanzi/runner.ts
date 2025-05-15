import axios from 'taro-axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { dbModel } from '../../model'
import { delay, purify } from 'src/utils'

export enum DuanziEventType {
  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  ERROR = 'Error'
}

export interface GenerateRequestPayload {
  historyMessages?: string[]
  generateAudio?: boolean
  simulatorId: number
  modelId: number
}

export interface GenerateResponsePayload {
  modelId: number
  text: string
  audio: string
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

  static prompt = (simulatorId: number, historyMessages?: string[]) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return Prompt.prompt(Intent.GENERATE, historyMessages || [])
  }

  static requestSearch = async (
    simulatorId: number,
    historyMessages?: string[],
    generateAudio?: boolean,
    modelId?: number
  ) => {
    const model = dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = DuanziRunner.prompt(simulatorId, historyMessages)

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

    const _generateAudio = (await dbBridge._Setting.get(
      dbModel.SettingKey.GENERATE_AUDIO
    )) as boolean
    if (
      (generateAudio !== undefined && !generateAudio) ||
      (_generateAudio !== undefined && !_generateAudio) ||
      !(textResp.data as Record<string, string>).content
    ) {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: ''
      }
    }

    try {
      const speechContent = purify.purifyText(
        (textResp.data as Record<string, string>).content
      )
      const voice = await DuanziRunner.speakerVoice(simulatorId)
      const audioResp = await axios.post(constants.TEXT2SPEECH_ASYNC_V2_API, {
        text: speechContent,
        voice
      })

      let audioUrl = undefined as unknown as string

      while (true) {
        const queryResp = await axios.get(
          `${constants.QUERY_AUDIO_API}/${(audioResp.data as Record<string, string>).audio_uid}`
        )
        const resp = queryResp.data as Record<string, string>
        if (!resp.settled && !resp.error) {
          await delay.delay(10000)
          continue
        }
        audioUrl = resp.audio_url
        break
      }

      return {
        text: (textResp.data as Record<string, string>).content,
        audio: audioUrl
      }
    } catch {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: ''
      }
    }
  }

  static handleGenerateRequest = async (
    payload: GenerateRequestPayload
  ): Promise<GenerateResponsePayload | undefined> => {
    const { historyMessages, generateAudio, simulatorId, modelId } = payload

    const response = await DuanziRunner.requestSearch(
      simulatorId,
      historyMessages,
      generateAudio,
      modelId
    )
    if (!response || !response.text) return

    return {
      modelId,
      ...response
    }
  }
}
