import { xiangsheng } from 'src/localstores'

export class XiangshengMessage {
  static create = (topic: string, modelId: number, message: string) => {
    xiangsheng.Xiangsheng.appendXiangshengMessage({
      topic,
      modelId,
      message
    })
  }
}
