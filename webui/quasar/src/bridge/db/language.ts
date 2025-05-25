export class _Language {
  static #languages = [
    '普通话',
    '北京话',
    '四川话',
    '上海话',
    '广西话',
    '哈尔滨话',
    '长沙话',
    '徐州话',
    '粤语',
    '郑州话',
    '陕西话',
    '贵州话',
    '云南话',
    '浙江话',
    '江苏话',
    '安徽话',
    '甘肃话',
    '新疆话',
    '青海话',
    '天津话'
  ]

  static languages = () => {
    return _Language.#languages
  }

  static randomPick = () => {
    return _Language.#languages[
      Math.floor(Math.random() * _Language.#languages.length)
    ]
  }
}
