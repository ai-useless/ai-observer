import axios from 'axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { dbModel } from '../../model'
import { delay, purify } from 'src/utils'

export enum SingEventType {
  SING_REQUEST = 'SingRequest',
  SING_RESPONSE = 'SingResponse',

  ERROR = 'Error'
}

export interface SingRequestPayload {
  simulatorId: number // NOT USED NOW
  lrcText: string
  refPrompt: string
}

export interface SingResponsePayload {
  audio: string
}

export interface SingEvent {
  type: SingEventType
  payload:
    | SingRequestPayload
    | SingResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: SingEventType
  payload: SingRequestPayload
}

export class SingRunner {
  static requestSing = async (lrcText: string, refPrompt: string) => {
    const _generateAudio = (await dbBridge._Setting.get(
      dbModel.SettingKey.GENERATE_AUDIO
    )) as boolean
    if (_generateAudio !== undefined && !_generateAudio) {
      return {
        audio: undefined
      }
    }

    try {
      lrcText = purify.purifyText(lrcText)

      const payload = {
        lrc_text: lrcText,
        ref_prompt: refPrompt
      } as Record<string, string>

      const audioResp = await axios.post(constants.SING_ASYNC_API, payload)

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

  static handleSingRequest = async (
    payload: SingRequestPayload
  ): Promise<SingResponsePayload | undefined> => {
    const { lrcText, refPrompt } = payload

    const response = await SingRunner.requestSing(lrcText, refPrompt)
    if (!response || !response.audio) return

    return response
  }
}
