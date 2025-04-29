import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios from 'taro-axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: undefined as unknown as string,
    avatar: undefined as unknown as string,
    avatarUrl: undefined as unknown as string
  }),
  actions: {
    getUser(code: string, done?: (error: boolean) => void) {
      const url = `${constants.GET_USER}?code=${code}`
      axios.get(url).then((resp) => {
        if (done) done(false)
        if (!resp.data) return
        this.username = resp.data.wechat_username
        this.avatarUrl = resp.data.wechat_avatar_url
      }).catch((e) => {
        console.log(`Failed get user: ${JSON.stringify(e)}`)
        if (done) done(true)
      })
    },
    cookUser(code: string, done?: (error: boolean) => void) {
      if (!this.username || !this.avatar) return

      const url = `${constants.COOK_USER}`
      axios.post(url, {
        code,
        username: this.username,
        avatar: this.avatar
      }).then(() => {
        if (done) done(false)
      }).catch((e) => {
        console.log(`Failed cook user: ${JSON.stringify(e)}`)
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
  static avatarUrl = () => user.avatarUrl
  static setAvatar = (v: string) => (user.avatar = v)

  static getUser = (code: string) => user.getUser(code)
  static logined = () => user.username && user.avatar
  static cookUser = (code: string) => user.cookUser(code)
}
