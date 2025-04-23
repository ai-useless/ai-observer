import { dbModel } from '../../model'

export class _Message {
  private static messages = [] as dbModel.Message[]

  static create = (
    seminarId: number,
    participatorId: number,
    prompt: string,
    content: string,
    audio: string
  ) => {
    _Message.messages.push({
      id: _Message.messages.length,
      seminarId,
      participatorId,
      prompt,
      content,
      timestamp: Date.now(),
      audioCid: audio
    })
  }
}
