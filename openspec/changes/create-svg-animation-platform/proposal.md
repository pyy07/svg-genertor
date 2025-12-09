# Change: 创建 SVG 动画生成平台

## Why

用户需要一个能够根据自然语言描述自动生成 SVG 动画的网站。由于使用 Google AI Studio 的 API key 有使用限制，需要实现密码保护机制来控制访问。同时需要支持微信登录以提升用户体验，并保存所有生成的素材以供后续使用。

## What Changes

- **ADDED**: SVG 动画生成能力 - 使用 Gemini 3.0 模型根据用户输入生成 SVG 动画代码
- **ADDED**: 用户使用次数限制系统 - 每个登录用户默认可使用 3 次，管理员可设置永久用户（无限制）
- **ADDED**: 微信登录集成 - 支持用户通过微信账号登录
- **ADDED**: 素材存储系统 - 保存所有生成的 SVG 动画素材
- **ADDED**: Next.js 项目结构 - 搭建基于 Next.js 的 Web 应用框架
- **ADDED**: Vercel 部署配置 - 配置 GitHub 和 Vercel 的部署流程

## Impact

- **新增能力**: 
  - `svg-generation`: SVG 动画生成核心功能
  - `password-auth`: 用户使用次数限制和访问控制（基于用户身份，非密码）
  - `wechat-auth`: 微信 OAuth 登录
  - `asset-storage`: 素材持久化存储
- **技术栈**: Next.js, Google Gemini API, 微信开放平台 API, 数据库（待定）
- **部署**: GitHub + Vercel 自动化部署流程

