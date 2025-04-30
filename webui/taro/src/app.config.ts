export default {
  pages: [
    'pages/index/IndexPage',
    'pages/seminar/SeminarPage',
    'pages/user/UserPage',
    'pages/simulator/CookSimulatorPage',
    'pages/simulator/MySimulatorsPage',
    'pages/simulator/AllSimulatorsPage',
    'pages/guest/GuestsPage',
    'pages/model/ModelsPage'
  ],
  workers: 'worker',
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'AGI观点',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    custom: false,
    list: [
      { pagePath: 'pages/index/IndexPage', text: '首页' },
      { pagePath: 'pages/seminar/SeminarPage', text: 'AGI观点' },
      { pagePath: 'pages/user/UserPage', text: '我的' }
    ]
  }
}
