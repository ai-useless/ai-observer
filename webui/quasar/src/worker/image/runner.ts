import axios from 'axios'
import { constants } from '../../constant'
import { delay, purify } from 'src/utils'

export enum ImageEventType {
  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  ERROR = 'Error'
}

export interface GenerateRequestPayload {
  style: string
  prompt: string
  dialog: boolean
  extra: string
  highResolution: boolean
  ratio: string
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
  static requestGenerate = async (
    prompt: string,
    style: string,
    dialog: boolean,
    extra: string,
    highResolution: boolean,
    ratio: string
  ) => {
    prompt = `${purify.purifyText(prompt)}。 生成${style}风格的配图。生成的图严格遵循风格，自然，没有AI味道。生成的图片不允许有地域歧视、种族歧视、政治意义。`
    if (dialog)
      prompt +=
        '如果文字中有对话，在图片中添加气泡对话框，对话框的文字用黑体、仿宋、幼圆、楷体或卡通字体中的一种，对话框中的包含清晰的中文对话文本。'
    prompt += extra
    try {
      const imageResp = await axios.post(constants.GENERATE_IMAGE_ASYNC_API, {
        prompt,
        high_resolution: highResolution,
        ratio
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
    const { prompt, style, dialog, extra, highResolution, ratio } = payload

    const response = await ImageRunner.requestGenerate(
      prompt,
      style,
      dialog,
      extra,
      highResolution,
      ratio
    )
    if (!response || !response.image) return

    return response
  }
}
