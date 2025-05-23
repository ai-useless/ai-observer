export class _Language {
  static #languages = [
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
    return _Language.#languages
  }

  static randomPick = () => {
    return _Language.#languages[Math.floor(Math.random() * _Language.#languages.length)]
  }
}
