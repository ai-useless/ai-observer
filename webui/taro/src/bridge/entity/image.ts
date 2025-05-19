import { imageWorker } from 'src/worker'

export class EImage {
  static generate = (prompt: string, style: string, dialog: boolean, extra: string, highResolution: boolean, square: boolean, onImage: (image: string) => void, onError?: () => void) => {
    imageWorker.ImageRunner.handleGenerateRequest({
      prompt,
      style,
      dialog,
      extra,
      highResolution,
      square
    })
      .then((payload) => {
        if (payload && payload.image)
          onImage(payload.image)
      })
      .catch((e) => {
        console.log(`Failed generate image: ${e}`)
        onError?.()
      })
  }
}
