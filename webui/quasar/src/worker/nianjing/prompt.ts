export enum Intent {
  GENERATE = 'Generate'
}

enum PromptType {
  NO_HEAD_SPACE,
  NO_EMOJI,
  MERGE_SPACES,
  WITHOUT_POLITICAL,
  MUST_OBEY
}

type RequirementFunc = (...args: (string | number | string[])[]) => string

const Requirements = new Map<PromptType, RequirementFunc>([
  [PromptType.NO_HEAD_SPACE, (() => ') 行首不要有空格；') as RequirementFunc],
  [
    PromptType.NO_EMOJI,
    (() => ') 不包含表情、标签或额外提示；') as RequirementFunc
  ],
  [
    PromptType.MERGE_SPACES,
    (() => ') 行首无多余空格，连续空格合并为一个；') as RequirementFunc
  ],
  [
    PromptType.WITHOUT_POLITICAL,
    (() =>
      ') 不涉及国家领导人及相关政策内容，确保符合公序良俗和现行法规; ') as RequirementFunc
  ],
  [
    PromptType.MUST_OBEY,
    (() => '请严格遵守以上要求，结构清晰，内容完整。') as RequirementFunc
  ]
])

type IntentFunc = (...args: (string | number | string[])[]) => string

const IntentRequirements = new Map<Intent, PromptType[]>([
  [
    Intent.GENERATE,
    [
      PromptType.NO_EMOJI,
      PromptType.NO_HEAD_SPACE,
      PromptType.MERGE_SPACES,
      PromptType.WITHOUT_POLITICAL,
      PromptType.MUST_OBEY
    ]
  ]
])

const intentRequirements = (
  intent: Intent,
  ...args: (string | number | string[])[]
) => {
  const requirements = IntentRequirements.get(intent)
  if (!requirements) throw Error('Invalid intent')
  return (
    requirements
      .map((el, index) => {
        const _requirement = Requirements.get(el)
        if (!_requirement) throw Error('Invalid requirement')
        return index.toString() + (_requirement(...args) || '')
      })
      .join(' ') || ''
  )
}

export const IntentPrompt = new Map<Intent, IntentFunc>([
  [
    Intent.GENERATE,
    ((
      name: string
    ) => `你是儒释道三教古今文献经典大师, 请帮助用户查找文献${name}的原文。返回全文，不要省略或添加任何内容。20字左右一行。
          返回的内容将会用于文生音乐，因此需要返回LRC歌词格式，歌词预留10秒前奏，示例如下
          [00:10:30]暗夜精灵偷走女巫的心
          [00:15:80]我站在桥上看风景
          [00:21:30]银河系漫游不能等到爱情
          [00:26:60]或许坟场才是最后的风景
          [00:32:30]夏夜的繁星冲破幻影
          [00:37:40]没有人有心跳
          [00:42:60]剧情可能并不平静
          [00:48:20]我该如何原谅你
          [00:56:00]我的爱人
          [01:02:20]或许明天永远不会来临
          [01:08:40]去他妈的什么永恒
          要求: ${intentRequirements(Intent.GENERATE)}`) as IntentFunc
  ]
])

export class Prompt {
  static prompt = (intent: Intent, ...args: (string | number | string[])[]) => {
    const _args = [...args]
    const intentPrompt = IntentPrompt.get(intent)
    if (!intentPrompt) throw Error('Invalid intent')
    return intentPrompt(..._args)
  }

  static postProcess = (text: string) => {
    return text.split('\n').filter((el) => el.length)
  }
}
