import { config } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';

// 全局配置 Vue Test Utils
config.global.plugins = [ElementPlus];

// Mock Vuex store
const mockStore = createStore({
  state: {
    user: {
      token: 'mock-token',
      userInfo: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
      }
    },
    questions: {
      list: [],
      total: 0,
      loading: false
    },
    favorites: {
      list: [],
      total: 0
    },
    wrongQuestions: {
      list: [],
      total: 0
    }
  },
  mutations: {
    SET_USER_INFO: (state, userInfo) => {
      state.user.userInfo = userInfo;
    },
    SET_TOKEN: (state, token) => {
      state.user.token = token;
    },
    SET_QUESTIONS: (state, { list, total }) => {
      state.questions.list = list;
      state.questions.total = total;
    },
    SET_LOADING: (state, loading) => {
      state.questions.loading = loading;
    }
  },
  actions: {
    login: jest.fn(),
    logout: jest.fn(),
    fetchQuestions: jest.fn(),
    createQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn()
  }
});

// Mock Vue Router
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/questions', name: 'Questions', component: { template: '<div>Questions</div>' } }
  ]
});

config.global.mocks = {
  $store: mockStore,
  $router: mockRouter,
  $route: {
    path: '/',
    name: 'Dashboard',
    params: {},
    query: {},
    meta: {}
  }
};

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock Element Plus message
global.ElMessage = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
};

global.ElMessageBox = {
  confirm: jest.fn(),
  alert: jest.fn(),
  prompt: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:8080',
  origin: 'http://localhost:8080',
  protocol: 'http:',
  host: 'localhost:8080',
  hostname: 'localhost',
  port: '8080',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

// 测试工具函数
global.testUtils = {
  // 创建模拟的题目数据
  createMockQuestion: (overrides = {}) => ({
    id: 1,
    title: '测试题目',
    content: '这是一个测试题目',
    type: 'single',
    options: ['选项A', '选项B', '选项C', '选项D'],
    correct_answer: 'A',
    explanation: '这是解析',
    difficulty: 'medium',
    subject: '数学',
    tags: ['测试'],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  // 创建模拟的用户数据
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  // 创建模拟的API响应
  createMockApiResponse: (data, success = true, message = '操作成功') => ({
    success,
    message,
    data
  }),

  // 等待Vue组件更新
  waitForUpdate: async (wrapper) => {
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});