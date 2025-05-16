import axios from 'taro-axios'
import { constants } from '../../constant'
import { delay } from 'src/utils'

export enum ImageEventType {
  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  ERROR = 'Error'
}

export interface GenerateRequestPayload {
  prompt: string
}

export interface GenerateResponsePayload {
  image: string
}

export interface ImageEvent {
  type: ImageEventType
  payload: GenerateRequestPayload | GenerateResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: ImageEventType
  payload: GenerateRequestPayload
}

export class ImageRunner {
  static requestGenerate = async (prompt: string) => {
    try {
      const imageResp = await axios.post(constants.GENERATE_IMAGE_ASYNC_API, {
        prompt
      })

      let imageUrl = undefined as unknown as string

      while (true) {
        const queryResp = await axios.get(
          `${constants.QUERY_IMAGE_API}/${(imageResp.data as Record<string, string>).image_uid}`
        )
        const resp = queryResp.data as Record<string, string>
        if (!resp.settled && !resp.error) {
          await delay.delay(10000)
          continue
        }
        imageUrl = resp.image_url
        break
      }

      return {
        image: imageUrl
      }
    } catch {
      return {
        image: undefined
      }
    }
  }

  static handleGenerateRequest = async (
    payload: GenerateRequestPayload
  ): Promise<GenerateResponsePayload | undefined> => {
    const { prompt } = payload

    const response = await ImageRunner.requestGenerate(prompt)
    if (!response || !response.image) return

    return response
  }
}
