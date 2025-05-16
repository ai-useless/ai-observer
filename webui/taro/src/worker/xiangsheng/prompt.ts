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
    ((historyTopics: string[]) => {
      const actors = [
        '张三禄',
        '朱绍文',
        '阿彦涛',
        '沈春和',
        '恩绪',
        '徐长福',
        '裕德隆',
        '刘德智',
        '李德祥',
        '张德泉',
        '周德山',
        '马德禄',
        '焦德海',
        '张寿臣',
        '常连安',
        '郭荣起',
        '马三立',
        '郭启儒',
        '朱阔泉',
        '侯宝林',
        '张永熙',
        '刘宝瑞',
        '赵佩茹',
        '郭全宝',
        '王凤山',
        '马志明',
        '尹笑声',
        '常宝堃',
        '马季',
        '侯耀文',
        '石富宽',
        '苏文茂',
        '唐杰忠',
        '姜昆',
        '赵心敏',
        '张宏',
        '吕闻升',
        '华士泉',
        '杨贵田',
        '董长禄',
        '欧光慈',
        '马 季',
        '姜 昆',
        '赵炎',
        '刘伟',
        '冯巩',
        '笑林',
        '王谦祥',
        '李增瑞',
        '韩兰成',
        '刘喜尧',
        '彭子义',
        '常佩业',
        '黄志强',
        '黄宏',
        '尹卓林',
        '姚新光',
        '李国修',
        '赵龙军',
        '邢瑛瑛',
        '刘立新',
        '侯冠男',
        '王长林',
        '于海伦',
        '刘义学',
        '朱周义',
        '李立山',
        '杨进明',
        '王林',
        '姜宝林',
        '宋雁波',
        '侯连友',
        '李志强',
        '赵振铎',
        '李金斗',
        '王文友',
        '肖巍',
        '贾承伯',
        '魏文亮',
        '李相友',
        '罗峰',
        '李孟遥',
        '刘文亨',
        '高吉庆',
        '马云路',
        '高顺来',
        '陶大为',
        '刘文步',
        '李明刚',
        '赵伟洲',
        '武福星',
        '吉马',
        '郭新',
        '黄运成',
        '刘俊杰',
        '苏士杰',
        '崔金泉',
        '宋德全',
        '张茂起',
        '李建华',
        '李 艺',
        '刘全刚',
        '李金祥',
        '赵 斌',
        '崔喜跃',
        '杨 宁',
        '巩汉林',
        '魏真柏',
        '朱琦',
        '汪声亚',
        '杨祖尧',
        '卡尔罗',
        '马洛',
        '罗爱恬',
        '白玉',
        '周伟',
        '张文甫',
        '刘玉辉',
        '丁广泉',
        '连春建',
        '郝莲露',
        '常 亮',
        '马马杜',
        '莲 娜',
        '玛丽娜',
        '阿努拉',
        '董漠涵',
        '莫里斯',
        '伊丽沙白',
        '石桥久弥',
        '李佳骏',
        '龚哲平',
        '米雷娜',
        '李霁霞',
        '马震',
        '金文和',
        '徐祖国',
        '郭伦',
        '张玉琪',
        '朱文正',
        '孙继忠',
        '史文惠',
        '杨四奇',
        '赵晶',
        '王雅福',
        '刘际',
        '沙跃生',
        '李文成',
        '杨常州',
        '王常柱',
        '郭文歧',
        '王少林',
        '李玉君',
        '刘文亮',
        '马洪海',
        '刘洪江',
        '杨洪滨',
        '韩笑',
        '王学义',
        '李士琦',
        '李中华',
        '段军',
        '丁玉鹏',
        '王蓬',
        '杨紫阳',
        '仇君',
        '戴福月',
        '高东明',
        '于化民',
        '王锦文',
        '冯敏山',
        '果克',
        '陈庆',
        '刘玉才',
        '赵连升',
        '赵荣全',
        '郑小山',
        '魏元成',
        '罗健',
        '贾世泉',
        '李伟',
        '王平',
        '刘加柯',
        '刘科',
        '孙世达',
        '严玉林',
        '童鸣',
        '叶杰平',
        '范振钰',
        '赵津生',
        '腾生祥',
        '彭 华',
        '于志勇',
        '郭伯良',
        '何世铭',
        '王传林',
        '丛波',
        '杨俊杰',
        '马腾翔',
        '刘春山',
        '张德起',
        '高峰',
        '陈永忠',
        '元春起',
        '赵传璋',
        '周洪儒',
        '殷培田',
        '蒋明孝',
        '林文春',
        '李铎',
        '李伯祥',
        '刘继深',
        '郑健',
        '戴志诚',
        '刘毛毛',
        '李增满',
        '高玉林',
        '耿 直',
        '王 平',
        '孙承林',
        '孙强',
        '高吉林',
        '金旺',
        '高英培',
        '苏明杰',
        '李松岩',
        '高 青',
        '吴 健',
        '鲁少华',
        '孟凡贵',
        '赵保乐',
        '李嘉存',
        '韩 翔',
        '李志刚',
        '杨天立',
        '朱强',
        '刘显东',
        '吴金富',
        '傅向波',
        '马志存',
        '马洪升',
        '赵传真',
        '王宏',
        '王文进',
        '战暑日',
        '孙殿盛',
        '王元锋',
        '徐德奎',
        '刘树青',
        '刘金瑞',
        '吴刚伦',
        '陈治华',
        '王印权',
        '叶景林',
        '李少泉',
        '张志宽',
        '王影贤',
        '马政',
        '宋 勇',
        '周 静',
        '施文琳',
        '李 刚',
        '齐力新',
        '孙欣梅',
        '黄文忠',
        '秘鸿泉',
        '陆文荣',
        '曹鸿伟',
        '李国盛',
        '赵新华',
        '刘廷凯',
        '金幼峰',
        '隋广斌',
        '王泽民',
        '李平',
        '赵连功',
        '王琪',
        '高金奎',
        '高滨江',
        '王小生',
        '甄靖',
        '左春来',
        '陈树桐',
        '孙兴海',
        '秦玉贵',
        '贾冀光',
        '王天佐',
        '张大礼',
        '牛成志',
        '齐满意',
        '王少立',
        '张新华',
        '于辉',
        '高祥',
        '王茵',
        '刘洪沂',
        '李伟建',
        '甄奇',
        '吴兆南',
        '江南',
        '侯冠群',
        '刘增锴',
        '郎祖筠',
        '刘尔金',
        '樊光耀',
        '贾 伦',
        '单联丽',
        '王 荃',
        '高玉庆',
        '李炳杰',
        '陈寒柏',
        '李福盛',
        '郭秋林',
        '刘 际',
        '奇志',
        '姜桂成',
        '刘捷',
        '王玉',
        '郭晓小',
        '荆林野',
        '郭德纲',
        '殷文硕',
        '高迪艺',
        '郭迪传',
        '白迪瀚',
        '邢迪海',
        '荣迪曲',
        '马迪飞',
        '刘迪天',
        '徐迪建',
        '帕迪西',
        '李迪振',
        '李迪域',
        '赵迪兴',
        '杨迪中',
        '阿迪华',
        '任迪山',
        '郭迪业',
        '刘岩',
        '康达夫',
        '郭铁林',
        '许秀林',
        '朱军',
        '吕少明',
        '马济江',
        '董树良',
        '钱麟',
        '祁乾宁',
        '师胜杰',
        '刘 彤',
        '邹德江',
        '王 敏',
        '王 刚',
        '陈 强',
        '侯 军',
        '阮 航',
        '刘 伟',
        '王 海',
        '张 冲',
        '何树成',
        '周 威',
        '杨志刚',
        '徐永刚',
        '夏景华',
        '邳建新',
        '牟玉春',
        '马云翔',
        '关自仁',
        '刘建平',
        '刘跃宁',
        '乔国庆',
        '第八代',
        '第九代',
        '刘颖',
        '大兵',
        '毛威',
        '韩冰',
        '刘畅',
        '付强',
        '方清平',
        '王政',
        '武宾',
        '李冲',
        '满昱',
        '郭培鑫',
        '周旭',
        '丁冬',
        '刘艺',
        '王越',
        '辛曲',
        '穆全',
        '沈世鹏',
        '李彬',
        '张滦',
        '潘云侠',
        '张云雷',
        '岳云鹏',
        '孔云龙',
        '曹云金',
        '柏迈高',
        '奇 志',
        '何晶晶',
        '刘 惠',
        '白 桦',
        '邓小林',
        '大 山',
        '刘全利',
        '刘全和',
        '赵卫国',
        '李道南',
        '陆 鸣',
        '许 勇',
        '夏文兰',
        '倪 明',
        '唐爱国',
        '齐立强',
        '句 号',
        '徐 文',
        '郭 丹',
        '曹曙光'
      ]
      const actorIndex = Math.ceil(Math.random() * actors.length)
      const actor = actors[actorIndex]
      const scriptIndex = Math.ceil(Math.random() * 20)
      return `你是相声剧本大全图书馆，用户需要你寻找你的数据集中${actor}表演的20个台词字数超过2000个中文字的对口相声剧本。
       记住，用户不需要你搜索实时数据，从你的数据集中寻找即可。如果下面用户观看列表不为空，不包含该列表中给出的节目，
       从这些剧本中选取第${scriptIndex}个剧本返回全部文本，返回应包含开场、过渡、展开、谢场等剧本必须部分，
       不要精简任何台词，不要省略任何台词文字，不要为了摘要省略任何文字，总是展开返回全部文本，不要用省略号或者省略语句代替。
       剧本需要包含标题和剧本内容，剧本标题中需要包含表演者名字。剧本内容用逗哏和捧哏标识表演双方。
       返回纯文本，只返回标题和剧本内容，返回格式如下：
       标题：xxxxxxxxxx
       逗哏：xxxxxxxxxxxxxxx
       捧哏：xxxxxxxxxxxxxxx
       要求: ${intentRequirements(Intent.CLASSIC_SCRIPTS, historyTopics)}`
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

  static postProcess = (text: string): string[] => {
    return text.split('\n').filter((el) => el.length > 0)
  }
}
