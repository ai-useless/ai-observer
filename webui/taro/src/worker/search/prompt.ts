export enum Intent {
  SEARCH = 'Outline'
}

enum PromptType {
  NO_HEAD_SPACE,
  IDENT_2_SPACE,
  WITH_HTML,
  HTML_STYLE,
  SEGMENT,
  NO_EMOJI,
  MERGE_SPACES,
  WITH_EVENT,
  WITH_HISTORY_ANALYSIS,
  WITHOUT_POLITICAL,
  MUST_OBEY
}

type RequirementFunc = (...args: (string | number | string[])[]) => string

const Requirements = new Map<PromptType, RequirementFunc>([
  [PromptType.NO_HEAD_SPACE, (() => ') 行首不要有空格；') as RequirementFunc],
  [
    PromptType.IDENT_2_SPACE,
    (() =>
      ') 资料分级采用两个空格缩进，参考文献、链接独立成行并用方括号加数字标识，链接可以点击跳转；') as RequirementFunc
  ],
  [
    PromptType.WITH_HTML,
    (() => ') 输出格式为纯HTML；') as RequirementFunc
  ],
  [
    PromptType.HTML_STYLE,
    (() =>
      ') 一级标题字体14px加粗，二级标题12px加粗，正文12px常规字体，行高1.5em；') as RequirementFunc
  ],
  [PromptType.SEGMENT, (() => ') 根据语义合理分段；') as RequirementFunc],
  [
    PromptType.NO_EMOJI,
    (() =>
      ') 不包含表情、标签、换行符或额外提示；') as RequirementFunc
  ],
  [
    PromptType.MERGE_SPACES,
    (() => ') 行首无多余空格，连续空格合并为一个；') as RequirementFunc
  ],
  [
    PromptType.WITH_EVENT,
    (() =>
      ') 若资料含具体事例，列出带链接的上标，鼠标悬停显示链接，点击可跳转；') as RequirementFunc
  ],
  [
    PromptType.WITH_HISTORY_ANALYSIS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ((historyMessages: string[]) =>
      historyMessages.length ? `) 用户已经获取到下列内容 ${historyMessages.map((el, index) => index.toString() + ') ' + el).join('; ')}; ` : '') as RequirementFunc
  ],
  [
    PromptType.WITHOUT_POLITICAL,
    (() =>
      ') 不涉及国家领导人及相关政策内容，确保符合公序良俗和现行法规; ') as RequirementFunc
  ],
  [
    PromptType.MUST_OBEY,
    (() =>
      '请严格遵守以上要求，结构清晰，内容完整。') as RequirementFunc
  ]
])

type IntentFunc = (...args: (string | number | string[])[]) => string

const IntentRequirements = new Map<Intent, PromptType[]>([
  [
    Intent.SEARCH,
    [
      PromptType.NO_EMOJI,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.HTML_STYLE,
      PromptType.SEGMENT,
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
    Intent.SEARCH,
    ((
      topic: string,
      historyMessages: string[],
      prompt?: string
    ) => `你是一个搜索引擎，用户需要搜索${topic}相关的资料，${prompt && prompt.length ? '结合用户已经获得的内容为用户的新问题' + prompt : '这是用户第一次搜索'}， 返回搜索结果。
          要求: ${intentRequirements(Intent.SEARCH, historyMessages)}`) as IntentFunc
  ]
])

export class Prompt {
  static prompt = (intent: Intent, ...args: (string | number | string[])[]) => {
    const _args = [...args]
    const intentPrompt = IntentPrompt.get(intent)
    if (!intentPrompt) throw Error('Invalid intent')
    return intentPrompt(..._args)
  }
}
