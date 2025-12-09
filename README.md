# SVG 动画生成器

一个基于 Next.js 和 Google Gemini API 的 SVG 动画生成平台。

## 功能特性

- 🎨 根据自然语言描述生成 SVG 动画
- 🔐 用户使用次数限制（默认 3 次）
- 🔑 微信登录支持
- 💾 素材自动保存和管理
- 📱 响应式设计

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL (Prisma ORM)
- **AI**: Google Gemini 3.0 API
- **认证**: NextAuth.js + 微信 OAuth
- **样式**: Tailwind CSS

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写相关配置：

```bash
cp .env.example .env
```

需要配置的变量：
- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- `GOOGLE_AI_API_KEY`: Google AI Studio API Key
- `NEXTAUTH_SECRET`: NextAuth 密钥
- `WECHAT_APP_ID`: 微信开放平台 AppID
- `WECHAT_APP_SECRET`: 微信开放平台 AppSecret

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
.
├── app/                    # Next.js App Router 页面和 API 路由
│   ├── api/               # API 路由
│   │   ├── generate/      # SVG 生成接口
│   │   ├── user/          # 用户信息接口
│   │   ├── assets/        # 素材管理接口
│   │   └── auth/          # 认证接口
│   └── page.tsx           # 首页
├── components/            # React 组件
├── lib/                   # 工具函数
│   ├── prisma.ts         # Prisma 客户端
│   ├── gemini.ts         # Gemini API 封装
│   └── auth.ts           # 认证相关函数
├── prisma/               # Prisma schema
└── public/               # 静态资源
```

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成

### 数据库设置

推荐使用 Vercel Postgres 或 Supabase：

1. 创建 PostgreSQL 数据库
2. 获取连接字符串
3. 在环境变量中配置 `DATABASE_URL`
4. 运行 `npx prisma migrate deploy` 部署数据库 schema

## 开发

### 代码格式化

```bash
npm run format
```

### 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name migration_name

# 应用迁移
npx prisma migrate deploy
```

### Prisma Studio

```bash
npx prisma studio
```

## 许可证

MIT

