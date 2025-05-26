import { defineStore } from 'pinia'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    tabIndex: -1,
    currentMenu: '',
    showSetting: false,
    currentSettingMenu: '',
    contentHeight: 0
  }),
  actions: {},
  getters: {}
})

const setting = useSettingStore()

export class Setting {
  static tabIndex = () => setting.tabIndex

  static setTabIndex = (v: number) => (setting.tabIndex = v)

  static currentMenu = () => setting.currentMenu

  static setCurrentMenu = (v: string) => (setting.currentMenu = v)

  static showSetting = () => setting.showSetting

  static setShowSetting = (v: boolean) => (setting.showSetting = v)

  static currentSettingMenu = () => setting.currentSettingMenu

  static setCurrentSettingMenu = (v: string) => (setting.currentSettingMenu = v)

  static contentHeight = () => setting.contentHeight

  static setContentHeight = (v: number) => (setting.contentHeight = v)
}
