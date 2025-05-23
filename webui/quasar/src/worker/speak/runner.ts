import axios from 'axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { dbModel } from '../../model'
import { delay, purify } from 'src/utils'

export enum SpeakEventType {
  SPEAK_REQUEST = 'SpeakRequest',
  SPEAK_RESPONSE = 'SpeakResponse',

  CONVERT_REQUEST = 'ConvertRequest',
  CONVERT_RESPONSE = 'ConvertResponse',

  ERROR = 'Error'
}

export interface SpeakRequestPayload {
  text: string
  simulatorId: number
}

export interface SpeakResponsePayload {
  audio: string
}

export interface ConvertRequestPayload {
  audioB64: string
}

export interface ConvertResponsePayload {
  text: string
}

export interface SpeakEvent {
  type: SpeakEventType
  payload:
    | SpeakRequestPayload
    | SpeakResponsePayload
    | ConvertRequestPayload
    | ConvertResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: SpeakEventType
  payload: SpeakRequestPayload | ConvertRequestPayload
}

export class SpeakRunner {
  static simulator = async (simulatorId: number) => {
    const simulator = await dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return simulator
  }

  static requestSpeak = async (simulatorId: number, text: string) => {
    const _generateAudio = (await dbBridge._Setting.get(
      dbModel.SettingKey.GENERATE_AUDIO
    )) as boolean
    if (_generateAudio !== undefined && !_generateAudio) {
      return {
        audio: undefined
      }
    }

    try {
      const speechContent = purify.purifyText(text)
      const simulator = await SpeakRunner.simulator(simulatorId)
      const audioResp = await axios.post(constants.TEXT2SPEECH_ASYNC_V3_API, {
        text: speechContent,
        voice: simulator?.audio_id,
        instruct: simulator?.language ? `用${simulator.language}话说` : ''
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
        audio: audioUrl
      }
    } catch {
      return {
        audio: undefined
      }
    }
  }

  static handleSpeakRequest = async (
    payload: SpeakRequestPayload
  ): Promise<SpeakResponsePayload | undefined> => {
    const { simulatorId, text } = payload

    const response = await SpeakRunner.requestSpeak(simulatorId, text)
    if (!response || !response.audio) return

    return response
  }

  static requestConvert = async (audioB64: string) => {
    try {
      const convertResp = await axios.post(constants.SPEECH_TO_TEXT_API, {
        audio_b64: audioB64
      })
      return {
        text: (convertResp.data as Record<string, string>).text
      }
    } catch {
      return {
        text: undefined
      }
    }
  }

  static handleConvertRequest = async (
    payload: ConvertRequestPayload
  ): Promise<ConvertResponsePayload | undefined> => {
    const { audioB64 } = payload

    const response = await SpeakRunner.requestConvert(audioB64)
    if (!response || !response.text) return

    return response
  }
}
