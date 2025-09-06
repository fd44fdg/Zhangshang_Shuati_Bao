// 极简诊断版服务器：定位端口、事件循环、路由匹配是否卡住
// 运行：npm run dev:min
console.log('[M0] starting minimal bootstrap');
const express = require('express');
const app = express();
console.log('[M1] express created');
const PORT = process.env.PORT || 3001;

// 全局最早请求日志，确认请求是否进入 Node
app.use((req,res,next)=>{
  const start = Date.now();
  process.stdout.write(`\n[M-REQ] ${req.method} ${req.url}`);
  // 2 秒看门狗：若 2 秒仍未发送响应则自动返回 504，证明链路卡住位置
  const watchdog = setTimeout(()=>{
    if(!res.headersSent){
      process.stdout.write(`\n[M-WATCHDOG] timeout firing for ${req.url}`);
      res.status(504).json({ ok:false, minimal:true, timeout:true, path:req.url });
    }
  },2000);
  res.on('finish', ()=>{
    process.stdout.write(` -> ${res.statusCode} ${Date.now()-start}ms`);
    clearTimeout(watchdog);
  });
  next();
});

app.get('/healthz', (req,res)=>{
  res.json({ ok:true, t:Date.now(), minimal:true, path:'/healthz' });
});

// 加入与正式服务相同的版本化健康检查路由
app.get('/api/v1/health', (req,res)=>{
  console.log('[M-HANDLER] /api/v1/health invoked');
  res.json({ ok:true, t:Date.now(), minimal:true, path:'/api/v1/health' });
});

app.get('/api/v1/ping', (req,res)=>{
  res.json({ pong:true, t:Date.now(), minimal:true, path:'/api/v1/ping' });
});

// 兜底 404，验证未匹配路由是否会正常返回
app.use((req,res)=>{
  res.status(404).json({ ok:false, minimal:true, code:404, path:req.url });
});

setInterval(()=>process.stdout.write('.'), 2000); // 事件循环活性指示

app.listen(PORT, ()=>{
  console.log('\n[M2] minimal server listening on', PORT);
});
