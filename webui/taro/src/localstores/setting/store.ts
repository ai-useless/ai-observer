import { defineStore } from 'pinia'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    tabIndex: -1
  }),
  actions: {},
  getters: {}
})

const setting = useSettingStore()

export class Setting {
  static tabIndex = () => setting.tabIndex

  static setTabIndex = (v: number) => setting.tabIndex = v
}
