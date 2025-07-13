# 公共资源目录

此目录用于存储静态资源文件，如：

- 用户头像
- 默认图片
- 其他公共资源

## 目录结构

```
public/
├── avatars/       # 用户头像
├── default/       # 默认资源
└── uploads/       # 上传文件
```

## 访问方式

这些资源可通过 `/static/` 路径访问，例如：

```
http://localhost:3000/static/default/default-avatar.png
```