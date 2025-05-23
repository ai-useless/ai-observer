import { imageWorker } from 'src/worker'

export class EImage {
  static generate = (
    prompt: string,
    style: string,
    dialog: boolean,
    extra: string,
    highResolution: boolean,
    ratio: string,
    onImage: (image: string) => void,
    onError?: () => void
  ) => {
    imageWorker.ImageRunner.handleGenerateRequest({
      prompt,
      style,
      dialog,
      extra,
      highResolution,
      ratio
    })
      .then((payload) => {
        if (payload && payload.image) onImage(payload.image)
        else {
          console.log('Failed generate image')
          if (onError) onError()
        }
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed generate image: ${e}`)
        if (onError) onError()
      })
  }
}
