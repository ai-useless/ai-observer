import { dbSeminar } from 'src/controller'

export class _Message {
  static create = async (seminarId: number, participatorId: number, prompt: string, content: string) => {
    await dbSeminar.messages.add({
      seminarId,
      participatorId,
      prompt,
      content,
      timestamp: Date.now()
    })
  }

  static participators = async (seminarId: number) => {
    return await dbSeminar.participators.where('seminarId').equals(seminarId).toArray()
  }
}
