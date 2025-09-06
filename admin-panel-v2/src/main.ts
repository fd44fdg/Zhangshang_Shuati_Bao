import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import routes from './routes'
import './styles.css'
import { useUserStore } from './stores/user'
import { message, loadingBar } from './ui/discrete'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
const router = createRouter({ history: createWebHistory(), routes })

// 路由守卫：认证 + 角色
router.beforeEach(async (to, _from, next) => {
	loadingBar.start()
	const userStore = useUserStore()
	if (to.meta?.requiresAuth) {
		try {
			// 尝试获取用户信息，如果没有或失效会自动跳转登录
			if (!userStore.profile) {
				await userStore.fetchProfile()
			}
			// 检查角色权限
			if (to.meta.roles && to.meta.roles.length > 0) {
				const ok = to.meta.roles.some(r => userStore.roles.includes(r))
				if (!ok) {
					message.warning('无访问权限')
					return next('/403')
				}
			}
		} catch (e) {
			message.error('请先登录')
			return next({ path: '/login', query: { redirect: to.fullPath } })
		}
	}
	if (to.path === '/login' && useUserStore().isLogged) {
		return next('/')
	}
	next()
})

router.afterEach(() => {
	loadingBar.finish()
})

router.onError(() => {
	loadingBar.error()
})

app.use(router)
app.mount('#app')
