export enum Intent {
  GENERATE = 'Generate'
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
      historyMessages: string[],
    ) => `你是相声剧本创作者，请创作一段德云社风格的相声，5到10分钟时长，需要排除用户已经观看过的节目。
          返回纯文本，分别用“逗哏”和“捧哏”标识表演双方，角色表示和内容之间不换行。演员的语言轻松诙谐，包含高质量包袱。剧本风格参考下列片段：
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
          郭德纲：你想不疯了嘛那不是。
          于谦：就是。
          郭德纲：而且来了之后就敞开的乐，你只要多乐，你这钱就算回来了。
          于谦：这就值了。
          郭德纲：你要不乐我也不退是吧。
          于谦：可不是不退嘛。
          郭德纲：所以我劝你们该乐就乐。人就难得的就是快乐。
          于谦：你？
          郭德纲：我们家粽子的海洋。
          于谦：什么？
          郭德纲：都是粽子。
          于谦：朋友送的。
          郭德纲：朋友送的，还有朋友托我送给别人的。
          于谦：您都留下了？
          郭德纲：他们也吃不下那么些。
          于谦：你也吃不了那么些。
          郭德纲：我可以冻起来。
          于谦：就你们家有冰柜是吗。
          郭德纲：明年我再送人也是好的。
          于谦：明年再送。
          郭德纲：粽子是传统食品。
          于谦：是啊。
          郭德纲：北方人，江米小枣、豆沙莲蓉，有栗子的，红小豆的。
          于谦：什么馅都有。
          郭德纲：南方人吃的有火腿的，有咸肉的，上海那个鸭蛋黄的。
          要求: ${intentRequirements(Intent.GENERATE, historyMessages)}`) as IntentFunc
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
