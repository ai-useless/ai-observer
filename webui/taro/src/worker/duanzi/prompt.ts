export enum Intent {
  GENERATE = 'Generate'
}

enum PromptType {
  NO_HEAD_SPACE,
  WITH_HTML,
  HTML_STYLE,
  SEGMENT,
  NO_EMOJI,
  MERGE_SPACES,
  WITH_HISTORY_ANALYSIS,
  WITHOUT_POLITICAL,
  MUST_OBEY
}

type RequirementFunc = (...args: (string | number | string[])[]) => string

const Requirements = new Map<PromptType, RequirementFunc>([
  [PromptType.NO_HEAD_SPACE, (() => ') 行首不要有空格；') as RequirementFunc],
  [PromptType.WITH_HTML, (() => ') 输出格式为纯HTML；') as RequirementFunc],
  [
    PromptType.HTML_STYLE,
    (() =>
      ') 一级标题字体14px加粗，二级标题12px加粗，正文12px常规字体，行高1.5em；') as RequirementFunc
  ],
  [PromptType.SEGMENT, (() => ') 根据语义合理分段；') as RequirementFunc],
  [
    PromptType.NO_EMOJI,
    (() => ') 不包含表情、标签、换行符或额外提示；') as RequirementFunc
  ],
  [
    PromptType.MERGE_SPACES,
    (() => ') 行首无多余空格，连续空格合并为一个；') as RequirementFunc
  ],
  [
    PromptType.WITH_HISTORY_ANALYSIS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ((historyMessages: string[]) =>
      historyMessages.length
        ? `) 用户已经获取到下列内容 ${historyMessages.map((el, index) => index.toString() + ') ' + el).join('; ')}; `
        : '') as RequirementFunc
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
    Intent.GENERATE,
    ((
      historyMessages: string[]
    ) => `你是一个比李诞还棒的搞笑段子创作者，请创作5个符合中国人笑点的不同领域不同题材的像内涵段子和糗事百科一样的搞笑段子。每个段子字数60字以内，包含没有序号的标题，段子内容需要包含人物、事件以及过程。
          不同的段子单独一段，标题单独一行，需要HTML格式，标题居中，段子之间相隔16px。要求: ${intentRequirements(Intent.GENERATE, historyMessages)}`) as IntentFunc
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
