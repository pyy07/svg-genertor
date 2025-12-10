# SVG 动画生成器

一个基于 Next.js 和 Google Gemini API 的 SVG 动画生成平台。

## 功能特性

- 🎨 根据自然语言描述生成 SVG 动画
- 🤖 支持多个 AI 模型提供商（Google Gemini、OpenAI）
- 🔐 用户使用次数限制（默认 3 次）
- 🔑 微信登录支持
- 💾 素材自动保存和管理
- 📱 响应式设计

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL (Prisma ORM)
- **AI**: Google Gemini API / OpenAI API（支持多 Provider）
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

需要配置的变量（详见 `.env.example`）：

**必填项：**
- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- 至少一个 AI Provider 的 API Key：
  - `GOOGLE_AI_API_KEY`: Google AI Studio API Key（Gemini Provider）
  - `OPENAI_API_KEY`: OpenAI API Key（OpenAI Provider）
- `NEXTAUTH_SECRET`: NextAuth 密钥
- `NEXTAUTH_URL`: 应用访问地址

**AI Provider 配置（可选）：**
- `AI_PROVIDER`: 默认使用的 Provider（`gemini` 或 `openai`）
- `GEMINI_MODEL`: Gemini 模型名称（默认：`gemini-2.0-flash-exp`）
- `OPENAI_MODEL`: OpenAI 模型名称（默认：`gpt-4o`）
- `OPENAI_BASE_URL`: OpenAI API 基础 URL（默认：`https://api.openai.com/v1`）
  - 可用于配置代理服务或兼容 API
  - 示例：`https://api.openai-proxy.com/v1`

**其他可选配置：**
- `WECHAT_APP_ID`: 微信开放平台 AppID
- `WECHAT_APP_SECRET`: 微信开放平台 AppSecret
- `ALLOW_ANONYMOUS`: 允许匿名访问（本地测试用）
- `HTTPS_PROXY` / `HTTP_PROXY`: 代理地址

详细配置说明和示例请参考 `.env.example` 文件中的注释。

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
│   ├── ai/               # AI Provider 抽象层
│   │   ├── types.ts      # Provider 类型定义
│   │   ├── factory.ts    # Provider 工厂函数
│   │   └── providers/    # 具体 Provider 实现
│   │       ├── gemini.ts # Gemini Provider
│   │       └── openai.ts # OpenAI Provider
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

## AI Provider 配置

项目支持多个 AI 模型提供商，使用 Provider 模式实现：

### 支持的 Provider

1. **Google Gemini** (`gemini`)
   - 需要配置 `GOOGLE_AI_API_KEY`
   - 可用模型：`gemini-2.0-flash-exp`、`gemini-1.5-pro`、`gemini-1.5-flash`、`gemini-pro`
   - 默认模型：`gemini-2.0-flash-exp`

2. **OpenAI** (`openai`)
   - 需要配置 `OPENAI_API_KEY`
   - 可用模型：`gpt-4o`、`gpt-4-turbo`、`gpt-4`、`gpt-3.5-turbo`
   - 默认模型：`gpt-4o`

### 使用方式

1. **配置环境变量**：至少配置一个 Provider 的 API Key
2. **前端选择**：在生成页面可以选择使用的 Provider 和模型
3. **默认 Provider**：如果配置了 `AI_PROVIDER`，将作为前端默认选择

### Provider 优先级说明

当同时存在多种配置方式时，优先级如下：

1. **前端用户选择**（最高优先级）
   - 用户在页面上选择的 Provider 和模型
   - 会覆盖所有其他配置

2. **环境变量 `AI_PROVIDER`**
   - 如果配置了 `AI_PROVIDER`，前端会默认选中该 Provider
   - 如果用户没有手动选择，后端也会使用该 Provider

3. **自动检测**（最低优先级）
   - 如果未配置 `AI_PROVIDER`，系统会自动检测已配置的 Provider
   - 优先顺序：Gemini > OpenAI
   - 如果只配置了一个 Provider，自动使用该 Provider

**示例场景：**
- 场景1：配置了 `AI_PROVIDER=openai`，前端默认选中 OpenAI，用户可以选择切换
- 场景2：未配置 `AI_PROVIDER`，但配置了 Gemini 和 OpenAI，前端默认选中 Gemini（自动检测）
- 场景3：用户在前端选择了 OpenAI，即使配置了 `AI_PROVIDER=gemini`，也会使用 OpenAI（用户选择优先）

### 示例配置

```env
# 配置 Gemini Provider
GOOGLE_AI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp

# 配置 OpenAI Provider
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o
# 使用代理或兼容 API（可选）
OPENAI_BASE_URL=https://api.openai-proxy.com/v1

# 设置默认 Provider（可选）
AI_PROVIDER=gemini
```

### OpenAI BASE_URL 配置说明

`OPENAI_BASE_URL` 允许你自定义 OpenAI API 的端点地址，常见用途：

1. **使用代理服务**：如果无法直接访问 OpenAI API，可以使用代理服务
   ```env
   OPENAI_BASE_URL=https://api.openai-proxy.com/v1
   ```

2. **使用兼容 API**：使用兼容 OpenAI API 格式的其他服务
   ```env
   OPENAI_BASE_URL=https://your-compatible-api.com/v1
   ```

3. **本地测试**：使用本地运行的兼容服务进行测试
   ```env
   OPENAI_BASE_URL=http://localhost:8080/v1
   ```

如果不配置 `OPENAI_BASE_URL`，将使用默认的 OpenAI 官方 API 地址。

## 本地测试模式

为了方便本地开发测试，可以启用匿名访问模式，无需登录即可生成 SVG：

在 `.env` 文件中添加：
```env
ALLOW_ANONYMOUS=true
```

启用后：
- ✅ 无需登录即可生成 SVG
- ✅ 不限制使用次数
- ✅ 生成的 SVG 不会保存到数据库
- ⚠️ 仅用于本地开发，生产环境请勿启用

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

