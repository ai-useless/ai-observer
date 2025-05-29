import Taro from '@tarojs/taro'
import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios from 'taro-axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: undefined as unknown as string,
    avatar: undefined as unknown as string,
    avatarUrl: undefined as unknown as string,
    displayAvatar: undefined as unknown as string,
    mySimulators: 0
  }),
  actions: {
    getUser(code: string, done?: (error: boolean) => void) {
      const url = `${constants.GET_USER}?code=${code}`
      axios
        .get(url)
        .then((resp) => {
          if (!resp.data) return

          this.username = resp.data.wechat_username
          this.avatarUrl = resp.data.wechat_avatar_url
          this.mySimulators = resp.data.my_simulators

          this.getAvatar(done)
        })
        .catch((e) => {
          console.log(`Failed get user: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    },
    cookUser(code: string, done?: (error: boolean) => void) {
      if (!this.username || !this.avatar) return

      const url = `${constants.COOK_USER}`
      axios
        .post(url, {
          code,
          username: this.username,
          avatar: this.avatar
        })
        .then(() => {
          if (done) done(false)
        })
        .catch((e) => {
          console.log(`Failed cook user: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    },
    getAvatar(done?: (error: boolean) => void) {
      axios
        .get(this.avatarUrl, {
          responseType: 'arraybuffer'
        })
        .then((resp) => {
          if (done) done(false)
          this.avatar = Taro.arrayBufferToBase64(new Uint8Array(resp.data))
        })
        .catch((e) => {
          console.log(`Failed get avatar: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    }
  },
  getters: {}
})

const user = useUserStore()

export class User {
  static username = () => user.username
  static setUsername = (v: string) => (user.username = v)
  static avatar = () => user.avatar
  static displayAvatar = () => user.displayAvatar
  static avatarUrl = () => user.avatarUrl
  static setAvatar = (v: string, display?: string) => {
    user.avatar = v
    user.displayAvatar = display as unknown as string
  }

  static getUser = (code: string, done?: (error: boolean) => void) => user.getUser(code, done)
  static logined = () => user.username && (user.avatar || user.avatarUrl)
  static cookUser = (code: string, done?: (error: boolean) => void) =>
    user.cookUser(code, done)

  static mySimulators = () => user.mySimulators
  static setMySimulator = (v: number) => (user.mySimulators = v)
}
