import { imageWorker } from 'src/worker'

export class EImage {
  static generate = (prompt: string, style: string, dialog: boolean, extra: string, onImage: (image: string) => void) => {
    imageWorker.ImageRunner.handleGenerateRequest({
      prompt,
      style,
      dialog,
      extra
    })
      .then((payload) => {
        if (payload && payload.image)
          onImage(payload.image)
      })
      .catch((e) => {
        console.log(`Failed generate image: ${e}`)
      })
  }
}
