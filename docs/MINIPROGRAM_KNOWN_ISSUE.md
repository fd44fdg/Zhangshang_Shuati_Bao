# 微信小程序首页白屏未结案问题说明

> 状态：未解决（等待社区协助）  
> 基线提交：commit 991e41d0 （main）  
> 影响范围：仅 mp-weixin 端首页（H5 正常）

## 1. 现象
微信开发者工具 & 真机：进入首页无任何可见 UI，背景空白；但：
- 页面 onLoad / onShow / mounted 等生命周期日志都会打印。
- 无报错堆栈（最初的 “Cannot set property 'query' of undefined” 已消失）。
- 网络请求可正常发出（可在工具 Network 面板看到）。
- 有时 `selectorQuery.selectAll().boundingClientRect()` 返回空数组或节点 rect 缺失，像是 WXML 未真实挂载。

## 2. 已确认“不相关”因素
- 业务逻辑：已最小化（仅基础数据加载 & 默认 banners 回退）。
- Vuex 启动：注释/恢复均不影响现象。
- runtimeConfig：移除与恢复均不改变白屏。
- 自定义 TabBar H5 增强：在 mp-weixin 构建中已禁用。
- 之前调试注入（QueryProbe / QueryGuard mixin / LayoutProbe）：全部移除后仍白屏。

## 3. 历史问题回顾
初期伴随一个报错：`Cannot set property 'query' of undefined`（来源于对 `this.$mp.query` 赋值时 this.$mp 未定义）。
后通过移除全局 mixin + 重建页面链路 + 删除调试页（home-min / simple-test）后该报错消失，仅剩白屏。

## 4. 关键线索
| 线索 | 说明 |
|------|------|
| 生命周期正常 | 说明 Page/Vue 实例创建成功 |
| WXML 不渲染或渲染后被清空 | selectorQuery 拿不到节点 |
| H5 正常 | 说明业务/数据层无致命错误 |
| 无控制台 Error | 非典型运行时异常 |

## 5. 可能方向（假设）
1. 编译产物中的 WXML/JSON 被意外裁剪（需核对 `dist/build/mp-weixin/pages/home/` 内容）。
2. 条件编译指令或平台差异导致根节点被隐藏（检查 `/* #ifdef */` 片段；当前代码已最小化，未发现）。
3. 第三方或全局样式将根容器高度设为 0 / display:none（建议在 DevTools Elements 查看真实样式树）。
4. 构建工具/基础库版本兼容性（尝试切换基础库 3.9.x / 3.10.x 已复现）。
5. 某早期残留缓存（建议删除开发者工具缓存后重新导入 dist 目录再次验证）。

## 6. 复现步骤（贡献者）
1. clone 仓库并 checkout main（确保在 commit 991e41d0 或之后未改动小程序）。
2. 进入目录：`cd zhangshang-shuati-app`。
3. 安装依赖：`npm i`。
4. 开发构建：`npm run dev:mp-weixin`（或使用已有 cross-env 命令，保持本地 API 服务可用/或改成任意可响应 200 的 mock）。
5. 微信开发者工具导入 `dist/build/mp-weixin`。
6. 进入首页 → 观察白屏 + 控制台日志。

## 7. 建议收集的诊断信息
请在提交 Issue 时附：
```
基础库版本：
开发者工具版本：
系统环境（Win/Mac）及架构：
是否真机同样白屏：
getCurrentPages() 输出：
home.wxml 片段（前 80 行）：
home.wxss 片段（前 80 行）：
console 日志（含生命周期）：
任意报错（若出现）：
是否尝试清缓存 & 重编译：
是否尝试新建一个纯静态页面并设为首页：结果？
```

## 8. 快速对比实验建议
| 实验 | 步骤 | 预期 | 解释 |
|------|------|------|------|
| A: 仅静态文本首页 | 创建 pages/test/plain.vue 仅含 `<view>OK</view>` 并设为首页 | 若显示 OK | 证明渲染管线有效，问题在原 home 结构/样式 |
| B: 移除所有样式 | 临时清空 home.vue `<style>` | 若恢复显示 | 样式遮挡或高度问题 |
| C: 强制注入调试节点 | 在 mounted 中 `wx.createSelectorQuery().select('body')` 旁输出 | 验证 DOM 构建时机 |
| D: 切换基础库 | 工具中改不同基础库版本 | 均白屏 | 排除特定版本 bug |

## 9. 可以尝试的下一步（未执行）
- 使用 `uni-app` 升级到最新 CLI & 依赖重新构建对比。
- 将 `home.vue` 拆成最小递增片段（先静态 text，然后逐段添加组件）定位触发点。
- 用官方示例项目替换 pages.json 验证工程级别差异。
- 打开“调试基础库”查看是否报内部异常。

## 10. 我们已做的清理保障
- 移除所有调试注入与实验页面，减少噪声。
- 恢复正常初始化（用户信息、runtimeConfig）。
- 保留 H5 正常运行，便于对比。

## 11. 如何贡献修复
1. Fork 仓库，创建分支：`fix/wechat-home-blank`。
2. 编写最小验证或对比实验（见第 8 节）。
3. 在 PR 中附上“复现信息模板”填写内容 + 你的定位结论。
4. 避免一次引入多个不相关修改（拆分 PR）。

## 12. Issue 模板（可复制）
```
标题：微信小程序首页白屏进一步线索 - <你的观察点>

【环境】
基础库：
开发者工具版本：
系统：

【复现步骤】
1.
2.

【观察结果】

【尝试的对比实验】
- 实验A：结果
- 实验B：结果

【日志摘录】

【推测原因】

【建议下一步】

```

---
欢迎任何客观、可重复、最小化的线索。谢谢！
