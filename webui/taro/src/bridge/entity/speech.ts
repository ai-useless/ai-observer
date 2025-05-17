import { speakWorker } from 'src/worker'

export class ESpeech {
  static speech2Text = async (audio_b64: string) => {
    return await speakWorker.SpeakRunner.handleConvertRequest({
      audio_b64
    })
  }
}
