export class _Language {
  static #languages = [
    '普通话',
    '四川话',
    '上海话',
    '广西话',
    '哈尔滨话',
    '长沙话',
    '徐州话',
    '粤语',
    '郑州话'
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
