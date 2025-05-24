import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios, { AxiosResponse } from 'axios'
import { UserInfo } from './types'
import { Cookies } from 'quasar'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: undefined as unknown as string,
    avatar: undefined as unknown as string,
    avatarUrl: undefined as unknown as string
  }),
  actions: {
    getUser(code?: string, done?: (error: boolean) => void) {
      const token = Cookies.get('X-Token')
      if (!code?.length && !token?.length) {
        done?.(true)
        return
      }
      const url = `${constants.GET_USER}?${code?.length ? 'code=' + code : ''}${code?.length && token?.length ? '&' : ''}${token?.length ? 'token=' + token : ''}`
      axios
        .get(url)
        .then((resp: AxiosResponse<UserInfo>) => {
          if (!resp.data) return

          this.username = resp.data.wechat_username
          this.avatarUrl = resp.data.wechat_avatar_url

          Cookies.set('X-Token', resp.data.token, { path: '/', expires: 2 })

          this.getAvatar(done)
        })
        .catch((e) => {
          console.log(`Failed get user: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    },
    cookUser(code: string, done?: (error: boolean, token?: string) => void) {
      const url = `${constants.COOK_USER}`
      axios
        .post(url, {
          code,
          username: this.username,
          avatar: this.avatar
        })
        .then((resp: AxiosResponse<UserInfo>) => {
          if (!resp.data) return
          if (done) done(false, resp.data.token)
          Cookies.set('X-Token', resp.data.token)
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
        .then((resp: AxiosResponse<ArrayBuffer>) => {
          this.avatar = Buffer.from(resp.data).toString('base64')
          if (done) done(false)
        })
        .catch((e) => {
          console.log(`Failed get avatar: ${JSON.stringify(e)}`, e)
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

  static getUser = (code?: string, done?: (error: boolean) => void) => user.getUser(code, done)
  static logined = () => user.username && (user.avatar || user.avatarUrl)
  static cookUser = (code: string, done?: (error: boolean) => void) =>
    user.cookUser(code, done)
}
