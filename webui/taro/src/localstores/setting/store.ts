import { defineStore } from 'pinia'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    inScratch: true,
    tabIndex: -1
  }),
  actions: {},
  getters: {}
})

const setting = useSettingStore()

export class Setting {
  static inScratch = () => setting.inScratch

  static setInScratch = (v: boolean) => setting.inScratch = v

  static tabIndex = () => setting.tabIndex

  static setTabIndex = (v: number) => setting.tabIndex = v
}
