export default {
  pages: [
    'pages/index/IndexPage',
    'pages/seminar/SeminarPage',
    'pages/user/UserPage',
    'pages/simulator/CookSimulatorPage',
    'pages/simulator/MySimulatorsPage',
    'pages/simulator/AllSimulatorsPage',
    'pages/seminar/guest/GuestsPage',
    'pages/model/ModelsPage',
    'pages/search/SearchPage',
    'pages/xiangsheng/XiangshengPage',
    'pages/xiangsheng/role/RolesPage',
    'pages/duanzi/DuanziPage',
    'pages/chat/ChatPage',
    'pages/english/EnglishPage'
  ],
  workers: 'worker',
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '没谱儿的AGI',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    custom: false,
    list: [
      { pagePath: 'pages/index/IndexPage', text: '首页' },
      { pagePath: 'pages/seminar/SeminarPage', text: 'AGI看世界' },
      { pagePath: 'pages/xiangsheng/XiangshengPage', text: 'AGI相声社' },
      { pagePath: 'pages/duanzi/DuanziPage', text: 'AGI有内涵' },
      { pagePath: 'pages/user/UserPage', text: '我的' }
    ]
  }
}
