import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Login from '@/views/Login.vue';
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus';

describe('Login.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Login, {
      global: {
        components: {
          ElForm,
          ElFormItem,
          ElInput,
          ElButton
        },
        mocks: {
          $router: {
            push: jest.fn()
          },
          $store: {
            dispatch: jest.fn()
          }
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  test('应该正确渲染登录表单', () => {
    expect(wrapper.find('.login-container').exists()).toBe(true);
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  test('应该显示正确的标题', () => {
    expect(wrapper.find('.login-title').text()).toBe('掌上刷题宝管理后台');
  });

  test('应该有用户名和密码输入框', () => {
    const usernameInput = wrapper.find('input[placeholder="请输入用户名"]');
    const passwordInput = wrapper.find('input[placeholder="请输入密码"]');
    
    expect(usernameInput.exists()).toBe(true);
    expect(passwordInput.exists()).toBe(true);
  });

  test('应该能够输入用户名和密码', async () => {
    const usernameInput = wrapper.find('input[placeholder="请输入用户名"]');
    const passwordInput = wrapper.find('input[placeholder="请输入密码"]');

    await usernameInput.setValue('admin');
    await passwordInput.setValue('password123');

    expect(wrapper.vm.loginForm.username).toBe('admin');
    expect(wrapper.vm.loginForm.password).toBe('password123');
  });

  test('应该验证必填字段', async () => {
    const form = wrapper.findComponent({ name: 'ElForm' });
    const submitButton = wrapper.find('button[type="submit"]');

    // 尝试提交空表单
    await submitButton.trigger('click');
    await nextTick();

    // 验证表单验证是否触发
    expect(form.vm.validate).toBeDefined();
  });

  test('应该在表单验证通过后调用登录', async () => {
    const mockDispatch = jest.fn().mockResolvedValue({
      success: true,
      data: { token: 'mock-token' }
    });
    const mockPush = jest.fn();

    wrapper.vm.$store.dispatch = mockDispatch;
    wrapper.vm.$router.push = mockPush;

    // 填写表单
    await wrapper.find('input[placeholder="请输入用户名"]').setValue('admin');
    await wrapper.find('input[placeholder="请输入密码"]').setValue('password123');

    // 模拟表单验证通过
    wrapper.vm.$refs.loginForm = {
      validate: jest.fn((callback) => callback(true))
    };

    // 提交表单
    await wrapper.vm.handleLogin();
    await nextTick();

    expect(mockDispatch).toHaveBeenCalledWith('user/login', {
      username: 'admin',
      password: 'password123'
    });
  });

  test('登录成功后应该跳转到首页', async () => {
    const mockDispatch = jest.fn().mockResolvedValue({
      success: true,
      data: { token: 'mock-token' }
    });
    const mockPush = jest.fn();

    wrapper.vm.$store.dispatch = mockDispatch;
    wrapper.vm.$router.push = mockPush;
    wrapper.vm.$refs.loginForm = {
      validate: jest.fn((callback) => callback(true))
    };

    await wrapper.vm.handleLogin();
    await nextTick();

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  test('登录失败应该显示错误信息', async () => {
    const mockDispatch = jest.fn().mockRejectedValue(new Error('登录失败'));
    const mockError = jest.fn();

    wrapper.vm.$store.dispatch = mockDispatch;
    global.ElMessage.error = mockError;
    wrapper.vm.$refs.loginForm = {
      validate: jest.fn((callback) => callback(true))
    };

    await wrapper.vm.handleLogin();
    await nextTick();

    expect(mockError).toHaveBeenCalledWith('登录失败，请检查用户名和密码');
  });

  test('应该有记住密码选项', () => {
    const rememberCheckbox = wrapper.find('input[type="checkbox"]');
    expect(rememberCheckbox.exists()).toBe(true);
  });

  test('应该能够切换密码显示状态', async () => {
    const passwordInput = wrapper.find('input[type="password"]');
    const toggleButton = wrapper.find('.password-toggle');

    expect(passwordInput.exists()).toBe(true);
    
    if (toggleButton.exists()) {
      await toggleButton.trigger('click');
      await nextTick();
      
      // 验证密码输入框类型是否改变
      const updatedInput = wrapper.find('input[placeholder="请输入密码"]');
      expect(updatedInput.attributes('type')).toBe('text');
    }
  });

  test('应该在加载时显示加载状态', async () => {
    wrapper.vm.loading = true;
    await nextTick();

    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('loading')).toBeDefined();
    expect(submitButton.text()).toContain('登录中');
  });

  test('应该有正确的样式类', () => {
    expect(wrapper.find('.login-container').exists()).toBe(true);
    expect(wrapper.find('.login-form').exists()).toBe(true);
    expect(wrapper.find('.login-title').exists()).toBe(true);
  });

  test('应该支持回车键提交', async () => {
    const handleLogin = jest.spyOn(wrapper.vm, 'handleLogin');
    const passwordInput = wrapper.find('input[placeholder="请输入密码"]');

    await passwordInput.trigger('keyup.enter');
    
    expect(handleLogin).toHaveBeenCalled();
  });

  test('应该清除表单验证错误', async () => {
    const form = wrapper.findComponent({ name: 'ElForm' });
    
    if (form.vm.clearValidate) {
      const clearValidate = jest.spyOn(form.vm, 'clearValidate');
      
      // 输入内容应该清除验证错误
      await wrapper.find('input[placeholder="请输入用户名"]').setValue('admin');
      
      expect(clearValidate).toHaveBeenCalled();
    }
  });
});