import { dbSeminar } from 'src/controller'

export class _Message {
  static create = async (
    seminarId: number,
    participatorId: number,
    prompt: string,
    content: string,
    audio: string,
    duration: number
  ) => {
    await dbSeminar.messages.add({
      seminarId,
      participatorId,
      prompt,
      content,
      timestamp: Date.now(),
      audio: audio,
      duration
    })
  }
}
