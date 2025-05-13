import { defineStore } from 'pinia'
import { XiangshengMessage } from './types'

export const useXiangshengStore = defineStore('xiangsheng', {
  state: () => ({
    uid: undefined as unknown as string,
    topic: undefined as unknown as string,
    messages: [] as XiangshengMessage[]
  }),
  actions: {},
  getters: {}
})

const xiangsheng = useXiangshengStore()

export class Xiangsheng {
  static xiangsheng = () => xiangsheng.uid

  static setXiangsheng = (v: string) => xiangsheng.uid = v

  static topic = () => xiangsheng.topic

  static setTopic = (v: string) => xiangsheng.topic = v

  static xiangshengMessages = () => xiangsheng.messages

  static appendXiangshengMessage = (v: XiangshengMessage) => xiangsheng.messages.push(v)
}
