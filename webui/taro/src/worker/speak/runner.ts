import axios from 'taro-axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { dbModel } from '../../model'
import { delay, purify } from 'src/utils'

export enum SpeakEventType {
  SPEAK_REQUEST = 'SpeakRequest',
  SPEAK_RESPONSE = 'SpeakResponse',

  ERROR = 'Error'
}

export interface SpeakRequestPayload {
  text: string
  simulatorId: number
}

export interface SpeakResponsePayload {
  audio: string
}

export interface SpeakEvent {
  type: SpeakEventType
  payload: SpeakRequestPayload | SpeakResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: SpeakEventType
  payload: SpeakRequestPayload
}

export class SpeakRunner {
  static speakerVoice = async (simulatorId: number) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return simulator.audio_id
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
      const voice = await SpeakRunner.speakerVoice(simulatorId)
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
}
