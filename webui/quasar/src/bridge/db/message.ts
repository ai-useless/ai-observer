import { dbSeminar, saveAudio, saveText } from 'src/controller'

export class _Message {
  static create = async (
    seminarId: number,
    participatorId: number,
    prompt: string,
    content: string,
    audio: string
  ) => {
    // If prompt and content is long, store its hash
    if (prompt.length > 32) prompt = await saveText(prompt)
    if (content.length > 32) content = await saveText(content)

    await dbSeminar.messages.add({
      seminarId,
      participatorId,
      prompt,
      content,
      timestamp: Date.now(),
      audioCid: audio
    })
  }
}
