export class _Language {
  static _languages = [
    '四川',
    '上海',
    '广东',
    '广西',
    '哈尔滨',
    '长沙',
    '徐州',
    '粤语',
    '郑州'
  ]

  static languages = () => {
    return _Language._languages
  }

  static randomPick = () => {
    return _Language._languages[Math.floor(Math.random() * _Language._languages.length)]
  }
}
