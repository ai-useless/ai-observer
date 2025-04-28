import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: undefined as unknown as string,
    avatar: undefined as unknown as string
  }),
  actions: {},
  getters: {}
})

const user = useUserStore()

export class User {
  static username = () => user.username
  static setUsername = (v: string) => user.username = v
  static avatar = () => user.avatar
  static setAvatar = (v: string) => user.avatar = v
}
