## ADDED Requirements

### Requirement: SVG 动画生成
系统 SHALL 根据用户的自然语言描述，使用 Google Gemini 3.0 API 生成 SVG 动画代码。

#### Scenario: 成功生成 SVG 动画
- **WHEN** 已登录用户提供自然语言描述
- **AND** 用户使用次数未超限
- **AND** API 调用成功
- **THEN** 系统返回有效的 SVG 代码
- **AND** SVG 代码被保存到数据库
- **AND** 用户使用次数增加 1
- **AND** 用户可以在页面上预览生成的动画

#### Scenario: API 调用失败
- **WHEN** 已登录用户提供自然语言描述
- **AND** 用户使用次数未超限
- **AND** Gemini API 调用失败
- **THEN** 系统返回错误信息
- **AND** 错误信息对用户友好
- **AND** 失败的请求不被保存
- **AND** 用户使用次数不增加

#### Scenario: 无效输入处理
- **WHEN** 用户提供的描述为空或无效
- **THEN** 系统返回验证错误
- **AND** 不进行 API 调用

### Requirement: Prompt 工程
系统 SHALL 使用精心设计的 prompt 模板，确保 Gemini API 生成有效的 SVG 动画代码。

#### Scenario: Prompt 格式化
- **WHEN** 用户输入自然语言描述
- **THEN** 系统将描述格式化为包含 SVG 代码要求的 prompt
- **AND** prompt 包含动画效果说明
- **AND** prompt 指定输出格式为有效的 SVG 代码

### Requirement: SVG 验证
系统 SHALL 验证生成的 SVG 代码的有效性。

#### Scenario: SVG 代码验证
- **WHEN** Gemini API 返回 SVG 代码
- **THEN** 系统验证代码格式的有效性
- **AND** 如果代码无效，返回错误或尝试修复

