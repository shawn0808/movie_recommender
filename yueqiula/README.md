# 约球啦 (Yueqiula)

找附近网球球友，按 NTRP 水平匹配，轻松约球。上海先行，后续扩展至更多城市和运动。

## 技术栈

- **前端:** Next.js 14, TypeScript, Tailwind CSS
- **后端:** Next.js API Routes, Prisma
- **数据库:** PostgreSQL
- **认证:** NextAuth.js（邮箱密码 + 后续 WeChat / 手机）

## 环境要求

- **Node.js 18+**（推荐 20 LTS）—— 必须，否则 `npm install` 会失败
- 若本机为 Node 10，请安装 [nvm](https://github.com/nvm-sh/nvm) 后执行：`nvm install 20 && nvm use 20`

## 快速开始

```bash
# 1. 安装依赖（需 Node 18+）
npm install

# 2. 配置环境变量（复制并填写 .env）
cp .env.example .env
# 编辑 .env，填入：
#   - DATABASE_URL（如 Neon/Supabase 免费层）
#   - NEXT_PUBLIC_AMAP_KEY（高德地图，从 https://lbs.amap.com 控制台创建应用获取）

# 3. 生成 Prisma 客户端并同步数据库
npm run db:generate
npm run db:push

# 4. （可选）添加示例数据
npm run db:seed

# 5. （可选）邮箱 OTP：配置 RESEND_API_KEY 发送真实邮件，否则开发时 OTP 打印到终端

# 6. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/
│   ├── (auth)/       # 认证相关（登录、注册）
│   ├── (main)/       # 主应用（浏览、创建、我的、消息、个人资料）
│   └── api/          # API 路由
├── components/
├── lib/
└── hooks/
```
