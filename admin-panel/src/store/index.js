import { createStore } from 'vuex'
import user from './modules/user'
import app from './modules/app'

const store = createStore({
  modules: {
    user,
    app
  },
  state: {
    // 全局状态
  },
  mutations: {
    // 全局mutations
  },
  actions: {
    // 全局actions
  },
  getters: {
    // 全局getters
  }
})

export default store