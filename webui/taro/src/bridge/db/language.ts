export class _Language {
  static _languages = [
    '普通话',
    '四川话',
    '上海话',
    '广东话',
    '广西话',
    '哈尔滨话',
    '长沙话',
    '徐州话',
    '粤语',
    '郑州话'
  ]

  static languages = () => {
    return _Language._languages
  }

  static randomPick = () => {
    return _Language._languages[Math.floor(Math.random() * _Language._languages.length)]
  }
}
