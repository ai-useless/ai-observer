export enum Intent {
  GENERATE = 'Generate',
  TOPICS = 'Topics'
}

enum PromptType {
  NO_HEAD_SPACE,
  NO_EMOJI,
  MERGE_SPACES,
  WITH_HISTORY_ANALYSIS,
  WITHOUT_POLITICAL,
  MUST_OBEY
}

type RequirementFunc = (...args: (string | number | string[])[]) => string

const Requirements = new Map<PromptType, RequirementFunc>([
  [PromptType.NO_HEAD_SPACE, (() => ') 行首不要有空格；') as RequirementFunc],
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
      `) 用户已经观看过下列节目 ${historyMessages.map((el, index) => index.toString() + ') ' + el).join('; ')}; `) as RequirementFunc
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
  ],
  [
    Intent.TOPICS,
    [
      PromptType.NO_EMOJI,
      PromptType.NO_HEAD_SPACE,
      PromptType.MERGE_SPACES,
      PromptType.WITH_HISTORY_ANALYSIS,
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
      topic: string,
      host: string,
      guest: string
    ) => `你是相声剧本创作者，请创作一段主题为${topic}德云社风格的相声，需要排除用户已经观看过的节目。
          逗哏为相声演员${host}，捧哏为相声演员${guest}。剧本应该包含合理的开场和谢场部分，不要突兀开始或结束。
          返回纯文本，分别用“逗哏”和“捧哏”标识表演双方，本行角色表示和内容之间不换行，不同角色的内容单独一行
          演员的语言轻松诙谐，包含高质量包袱，逗哏和捧哏的句式多变，剧本情节综合运用各种幽默和相声技法。剧本风格参考下列片段：
          郭德纲：我拎着它吧，还有啊，我拿不了这么些个。
          于谦：我帮您。
          郭德纲：也不合适，您拎这个。这都什么呀？
          于谦：还有我的呢。
          郭德纲：每次演出我都弄得跟进货似的，无以为报，你们老这样不合适，因为你这场你买了，下一场你要不买就……
          于谦：您还有够没有了。
          郭德纲：不是，我是站在他们的角度出发的。每次都买，你偶尔有一场不买，多丢人呢。
          于谦：您要脸不要脸呢。
          郭德纲：再一个你买了我未必也准爱吃，是不是？你就不如把钱给我。
          于谦：这还带折现的呢。
          郭德纲：就是，没多少，是个心意。
          于谦：什么叫心意？
          郭德纲：我得感谢现场的朋友们，这好几千人，拿钱买票。
          于谦：是。
          郭德纲：你说你们真是有钱，真的。
          于谦：这叫什么话呀。
          郭德纲：你们不光有钱，你们还会活着。
          于谦：会生活。
          郭德纲：甭管是几百块钱买张票吧，这一晚上哈哈一乐，打心里痛快。
          于谦：图个乐。
          郭德纲：这三百、五百、八百，甭管多少钱，你就打五百，这五百在家里边摆在桌子上，你看着，你乐不了。
          于谦：看着钱谁乐呀。
          郭德纲：你看着它你要乐出来，你那个病五百治不好，是吧。
          于谦：改神经了。
          要求: ${intentRequirements(Intent.GENERATE)}`) as IntentFunc
  ],
  [
    Intent.TOPICS,
    ((topic: string, historyTopics: string[]) =>
      `你是相声剧本创作者，请你拟定3个${topic}相关的相声主题，需要排除用户已经观看过的主题。
       返回纯文本，不同主题单独一行。
       要求: ${intentRequirements(Intent.TOPICS, historyTopics)}`) as IntentFunc
  ]
])

export class Prompt {
  static prompt = (intent: Intent, ...args: (string | number | string[])[]) => {
    const _args = [...args]
    const intentPrompt = IntentPrompt.get(intent)
    if (!intentPrompt) throw Error('Invalid intent')
    return intentPrompt(..._args)
  }

  static postProcess = (text: string): string[] => {
    return text.split('\n').filter((el) => el.length > 0)
  }
}
