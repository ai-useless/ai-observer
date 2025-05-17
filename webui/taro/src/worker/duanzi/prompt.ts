export enum Intent {
  GENERATE = 'Generate'
}

enum PromptType {
  NO_HEAD_SPACE,
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
    ((historyMessages: string[]) => {
      const topics = [
        '家庭趣事',
        '上班族烦恼',
        '购物经历',
        '吃喝玩乐',
        '网络热词',
        '社交尴尬',
        '城市生活',
        '社会热点',
        '恋爱趣事',
        '婚姻生活',
        '友情调侃',
        '单身自嘲',
        '老板与员工',
        '同事间的斗嘴',
        '加班吐槽',
        '面试经历',
        '学生趣闻',
        '考试焦虑',
        '教师与学生互动',
        '校园恋爱',
        '讽刺现实',
        '讽刺官僚',
        '讽刺社会不公',
        '反转结局',
        '表情包梗',
        '网红段子',
        '游戏吐槽',
        '二次元文化',
        '古代趣事',
        '名人轶事',
        '文化差异',
        '传统节日',
        '手机趣事',
        '互联网段子',
        'AI与机器人',
        '科技冷知识',
        '医院趣闻',
        '养生误区',
        '健身趣事',
        '饮食调侃'
      ]
      const topic1 = topics[Math.floor(Math.random() * topics.length)]
      const topic2 = topics[Math.floor(Math.random() * topics.length)]
      const topic3 = topics[Math.floor(Math.random() * topics.length)]
      const topic4 = topics[Math.floor(Math.random() * topics.length)]
      const topic5 = topics[Math.floor(Math.random() * topics.length)]
      return `你是一个幽默大师，擅长创作出令人捧腹的“内涵段子”风格的幽默搞笑段子或冷笑话。
          请生成5个关于${topic1}，${topic2}，${topic3}，${topic4}或${topic5}的段子或冷笑话。
          生成的段子应该符合汉语语法逻辑和汉语幽默逻辑，并合理使用汉语知识点和素材。要求：
          - 谐音双关，妙趣横生：段子中必须包含谐音梗或双关语义等搞笑元素，让听众在恍然大悟中获得快乐。
          - 反转吐槽，意料之外：段子要有生活中的反转和吐槽，打破常规思维，带来意想不到的笑点。
          - 热点结合，自然流畅：结合当前社会热点或网络流行语，但要自然结合，巧妙融入，不要生硬套用，避免尴尬。
          - 风趣幽默，雅俗共赏：语言要风趣幽默，避免低俗和敏感内容，确保段子的雅俗共赏。
          - 回味无穷，意犹未尽：段子应包含高质量幽默内容，不要解释幽默内容，给观看的人留下回味的余地，让他们自己“品”。
          示例：
          标题：怕什么
          内容：你知道一年365日男的女的都最怕哪一日吗？男的怕1月31日，女的怕12月1日。
          标题：涨跌
          内容：工资涨不动，发际线跌不停。
          基于以上风格生成新的段子。不同的段子有单独标题，单独一段，标题单独一行，返回纯文本。返回格式为：
          标题：xxxx
          内容：xxxxxxxxxxx
          标题：xxxx
          内容：xxxxxxxxxxx
          要求: ${intentRequirements(Intent.GENERATE, historyMessages)}`
    }) as IntentFunc
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
    return text.split('\n').filter((el) => el.length > 0)
  }
}
