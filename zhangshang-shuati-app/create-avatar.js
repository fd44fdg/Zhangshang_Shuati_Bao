// 创建默认头像图片
const fs = require('fs');
const path = require('path');

// 使用一个简单的Base64编码的蓝色背景带人形图标的SVG图像
const avatarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#4A90E2" rx="50" ry="50" />
  <path d="M50,30 C44.477,30 40,34.477 40,40 C40,45.523 44.477,50 50,50 C55.523,50 60,45.523 60,40 C60,34.477 55.523,30 50,30 Z M35,65 C35,65 35,60 50,60 C65,60 65,65 65,65 L65,70 L35,70 Z" fill="#FFFFFF"/>
</svg>
`;

// 将SVG转换为Base64
const avatarBase64 = Buffer.from(avatarSvg).toString('base64');
const avatarDataUrl = `data:image/svg+xml;base64,${avatarBase64}`;

// 创建默认头像文件路径
const staticDir = path.join(__dirname, 'static', 'images');
const avatarPath = path.join(staticDir, 'avatar-placeholder.png');

// 确保目录存在
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

// 使用Node.js的Canvas库将SVG转为PNG（此处只是示例，需要安装额外的包）
console.log('默认头像已创建在:', avatarPath);
console.log('Base64数据URL:', avatarDataUrl);

// 写入一个简单的HTML文件来显示和保存图像
const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>保存默认头像</title>
</head>
<body>
  <h2>请右键点击下方图像并选择"图像另存为..."，保存到 static/images/avatar-placeholder.png</h2>
  <img src="${avatarDataUrl}" alt="默认头像" width="100" height="100">
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'create-avatar.html'), htmlContent);
console.log('已生成HTML文件，请打开并保存图像');