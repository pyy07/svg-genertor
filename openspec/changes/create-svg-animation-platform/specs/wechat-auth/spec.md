## ADDED Requirements

### Requirement: 微信登录
系统 SHALL 支持用户通过微信账号登录。

#### Scenario: 微信登录成功
- **WHEN** 用户点击微信登录按钮
- **AND** 用户授权应用访问微信账号信息
- **THEN** 系统获取用户微信信息（openid、昵称等）
- **AND** 创建或更新用户记录
- **AND** 建立用户会话
- **AND** 用户被重定向到主页面

#### Scenario: 微信登录取消
- **WHEN** 用户在微信授权页面取消授权
- **THEN** 系统返回登录页面
- **AND** 显示取消登录的提示信息

#### Scenario: 微信登录失败
- **WHEN** 微信 OAuth 流程出现错误
- **THEN** 系统返回错误信息
- **AND** 用户保持在登录页面

### Requirement: 用户会话管理
系统 SHALL 维护已登录用户的会话状态。

#### Scenario: 会话保持
- **WHEN** 用户成功登录
- **THEN** 系统创建会话 token
- **AND** 会话在指定时间内保持有效
- **AND** 用户可以在多个页面间保持登录状态

#### Scenario: 会话过期
- **WHEN** 用户会话过期
- **THEN** 系统要求用户重新登录
- **AND** 用户被重定向到登录页面

#### Scenario: 用户登出
- **WHEN** 用户点击登出
- **THEN** 系统清除用户会话
- **AND** 用户被重定向到登录页面

### Requirement: 用户信息关联
系统 SHALL 将生成的 SVG 素材与微信用户关联。

#### Scenario: 素材与用户关联
- **WHEN** 已登录用户生成 SVG 动画
- **THEN** 系统将素材与用户 ID 关联
- **AND** 用户可以在个人素材库中查看

#### Scenario: 未登录用户生成素材
- **WHEN** 未登录用户通过密码生成 SVG
- **THEN** 系统保存素材但不关联用户
- **AND** 素材标记为匿名生成

