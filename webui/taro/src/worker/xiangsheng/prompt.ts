export enum Intent {
  GENERATE = 'Generate',
  TOPICS = 'Topics',
  CLASSIC_TOPICS = 'ClassicTopics',
  CLASSIC_SCRIPTS = 'ClassicScripts'
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
  ],
  [
    Intent.CLASSIC_TOPICS,
    [
      PromptType.NO_EMOJI,
      PromptType.NO_HEAD_SPACE,
      PromptType.MERGE_SPACES,
      PromptType.WITH_HISTORY_ANALYSIS,
      PromptType.WITHOUT_POLITICAL,
      PromptType.MUST_OBEY
    ]
  ],
  [
    Intent.CLASSIC_SCRIPTS,
    [
      PromptType.NO_EMOJI,
      PromptType.NO_HEAD_SPACE,
      PromptType.MERGE_SPACES,
      PromptType.WITH_HISTORY_ANALYSIS,
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
    ) => `你是相声剧本创作者，请创作一段主题为${topic}的相声剧本，字数大于1500中文字，只返回标题和剧本内容。
          演员的语言轻松诙谐，包含高质量包袱，逗哏和捧哏的句式多变，剧本情节综合运用各种幽默和相声技法，内容有深度。
          剧本中不要包含具体相声社团名称。剧本开场要自然而引人入胜，可以以和观众聊天的形式，或两个人打趣的形式开始。谢场要有
          多样性和随机性，不要用过于套路式的谢场。剧本展开过程需要使用诸如磨蔓儿、扒马褂等经典相声技法。
          逗哏为相声演员${host}，捧哏为相声演员${guest}。剧本应该包含合理的开场和谢场部分。
          返回纯文本，返回格式如下：
          标题：xxxxxxxxxx
          逗哏：xxxxxxxxxxxxxxx
          捧哏：xxxxxxxxxxxxxxx
          要求: ${intentRequirements(Intent.GENERATE)}`) as IntentFunc
  ],
  [
    Intent.TOPICS,
    ((topic: string, historyTopics: string[]) =>
      `你是相声剧本创作者，请你拟定3个${topic}相关的轻松诙谐或讽刺等相声主题，需要排除用户已经观看过的主题。
       返回纯文本，不同主题单独一行。
       要求: ${intentRequirements(Intent.TOPICS, historyTopics)}`) as IntentFunc
  ],
  [
    Intent.CLASSIC_TOPICS,
    ((historyTopics: string[]) =>
      `你是相声资料大全图书馆，请你准备6个不同素材的经典相声大主题，这些主题将会被作为中心生成更小的相声剧本题目，需要排除用户已经观看过的主题。
       例如，乱弹东周作为大的主题，下面会生成东周人物相关的剧本。返回纯文本，不同主题单独一行。
       要求: ${intentRequirements(Intent.CLASSIC_TOPICS, historyTopics)}`) as IntentFunc
  ],
  [
    Intent.CLASSIC_SCRIPTS,
    ((historyTopics: string[]) =>
      `你是相声剧本大全图书馆，用户需要随机选取10组相声演员，从中选取两个演员名字哈希离当前时间戳哈希海明距离最近的一对相声演员，查找他们表演的最少5个，
       最多20个互联网收录的台词字数超过2000个中文字的对口相声剧本。注意，不是要你创作，而是查找已经表演过剧本的，其中不包含用户之前已经观看过的节目，
       从这些居中本选取标题哈希离当前时间戳哈希海明距离最近的剧本返回全部文本，返回应包含开场、过渡、展开、谢场等剧本必须部分，不要精简任何台词，
       不要省略任何台词文字。剧本需要包含标题和剧本内容，剧本标题中需要包含表演者名字。剧本内容用逗哏和捧哏标识表演双方。
       返回纯文本，只返回标题和剧本内容，返回格式如下：
       标题：xxxxxxxxxx
       逗哏：xxxxxxxxxxxxxxx
       捧哏：xxxxxxxxxxxxxxx
       要求: ${intentRequirements(Intent.CLASSIC_SCRIPTS, historyTopics)}`) as IntentFunc
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
