import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Setting {
  static create = async (
    key: dbModel.SettingKey,
    value: unknown
  ) => {
    const setting = await _Setting.get(key)
    if (setting) {
      setting.value = value
      await dbSeminar.settings.update(setting, setting)
      return
    }
    await dbSeminar.settings.add({
      key, value
    })
  }

  static get = async (key: dbModel.SettingKey) => {
    return await dbSeminar.settings.where('key').equals(key).first()
  }
}
